/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import fs from 'fs'
import { Resolver, Query, Args, Arg, Authorized, Ctx, UseMiddleware, Mutation } from 'type-graphql'
import { getConnection, getCustomRepository } from 'typeorm'
import CONFIG from '../../config'
import { LoginViaVerificationCode } from '../model/LoginViaVerificationCode'
import { SendPasswordResetEmailResponse } from '../model/SendPasswordResetEmailResponse'
import { User } from '../model/User'
import { User as DbUser } from '@entity/User'
import encode from '../../jwt/encode'
import ChangePasswordArgs from '../arg/ChangePasswordArgs'
import CheckUsernameArgs from '../arg/CheckUsernameArgs'
import CreateUserArgs from '../arg/CreateUserArgs'
import UnsecureLoginArgs from '../arg/UnsecureLoginArgs'
import UpdateUserInfosArgs from '../arg/UpdateUserInfosArgs'
import { apiPost, apiGet } from '../../apis/HttpRequest'
import {
  klicktippRegistrationMiddleware,
  klicktippNewsletterStateMiddleware,
} from '../../middleware/klicktippMiddleware'
import { CheckEmailResponse } from '../model/CheckEmailResponse'
import { UserSettingRepository } from '../../typeorm/repository/UserSettingRepository'
import { LoginUserRepository } from '../../typeorm/repository/LoginUser'
import { Setting } from '../enum/Setting'
import { UserRepository } from '../../typeorm/repository/User'
import { LoginUser } from '@entity/LoginUser'
import { LoginUserBackup } from '@entity/LoginUserBackup'
import { LoginEmailOptIn } from '@entity/LoginEmailOptIn'
import { sendEMail } from '../../util/sendEMail'
import { LoginElopageBuysRepository } from '../../typeorm/repository/LoginElopageBuys'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const sodium = require('sodium-native')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const random = require('random-bigint')

// We will reuse this for changePassword
const isPassword = (password: string): boolean => {
  return !!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9 \\t\\n\\r]).{8,}$/)
}

const LANGUAGES = ['de', 'en']
const DEFAULT_LANGUAGE = 'de'
const isLanguage = (language: string): boolean => {
  return LANGUAGES.includes(language)
}

const PHRASE_WORD_COUNT = 24
const WORDS = fs.readFileSync('src/config/mnemonic.english.txt').toString().split('\n')
const PassphraseGenerate = (): string[] => {
  const result = []
  for (let i = 0; i < PHRASE_WORD_COUNT; i++) {
    result.push(WORDS[sodium.randombytes_random() % 2048])
  }
  return result
  /*
  return [
    'behind',
    'salmon',
    'fluid',
    'orphan',
    'frost',
    'elder',
    'amateur',
    'always',
    'panel',
    'palm',
    'leopard',
    'essay',
    'punch',
    'title',
    'fun',
    'annual',
    'page',
    'hundred',
    'journey',
    'select',
    'figure',
    'tunnel',
    'casual',
    'bar',
  ]
  */
}

/*
Test results:
INSERT INTO `login_users` (`id`, `email`, `first_name`, `last_name`, `username`, `description`, `password`, `pubkey`, `privkey`, `email_hash`, `created`, `email_checked`, `passphrase_shown`, `language`, `disabled`, `group_id`, `publisher_id`) VALUES
// old
(1, 'peter@lustig.de', 'peter', 'lustig', '', '', 4747956395458240931, 0x8c75edd507f470e5378f927489374694d68f3d155523f1c4402c36affd35a7ed, 0xb0e310655726b088631ccfd31ad6470ee50115c161dde8559572fa90657270ff13dc1200b2d3ea90dfbe92f3a4475ee4d9cee4989e39736a0870c33284bc73a8ae690e6da89f241a121eb3b500c22885, 0x9f700e6f6ec351a140b674c0edd4479509697b023bd8bee8826915ef6c2af036, '2021-11-03 20:05:04', 0, 0, 'de', 0, 1, 0);
// new
(2, 'peter@lustig.de', 'peter', 'lustig', '', '', 4747956395458240931, 0x8c75edd507f470e5378f927489374694d68f3d155523f1c4402c36affd35a7ed, 0xb0e310655726b088631ccfd31ad6470ee50115c161dde8559572fa90657270ff13dc1200b2d3ea90dfbe92f3a4475ee4d9cee4989e39736a0870c33284bc73a8ae690e6da89f241a121eb3b500c22885, 0x9f700e6f6ec351a140b674c0edd4479509697b023bd8bee8826915ef6c2af036, '2021-11-03 20:22:15', 0, 0, 'de', 0, 1, 0);
INSERT INTO `login_user_backups` (`id`, `user_id`, `passphrase`, `mnemonic_type`) VALUES
// old
(1, 1, 'behind salmon fluid orphan frost elder amateur always panel palm leopard essay punch title fun annual page hundred journey select figure tunnel casual bar ', 2);
// new
(2, 2, 'behind salmon fluid orphan frost elder amateur always panel palm leopard essay punch title fun annual page hundred journey select figure tunnel casual bar ', 2);
*/

const KeyPairEd25519Create = (passphrase: string[]): Buffer[] => {
  if (!passphrase.length || passphrase.length < PHRASE_WORD_COUNT) {
    throw new Error('passphrase empty or to short')
  }

  const state = Buffer.alloc(sodium.crypto_hash_sha512_STATEBYTES)
  sodium.crypto_hash_sha512_init(state)

  // To prevent breaking existing passphrase-hash combinations word indices will be put into 64 Bit Variable to mimic first implementation of algorithms
  for (let i = 0; i < PHRASE_WORD_COUNT; i++) {
    const value = Buffer.alloc(8)
    const wordIndex = WORDS.indexOf(passphrase[i])
    value.writeBigInt64LE(BigInt(wordIndex))
    sodium.crypto_hash_sha512_update(state, value)
  }
  // trailing space is part of the login_server implementation
  const clearPassphrase = passphrase.join(' ') + ' '
  sodium.crypto_hash_sha512_update(state, Buffer.from(clearPassphrase))
  const outputHashBuffer = Buffer.alloc(sodium.crypto_hash_sha512_BYTES)
  sodium.crypto_hash_sha512_final(state, outputHashBuffer)

  const pubKey = Buffer.alloc(sodium.crypto_sign_PUBLICKEYBYTES)
  const privKey = Buffer.alloc(sodium.crypto_sign_SECRETKEYBYTES)

  sodium.crypto_sign_seed_keypair(
    pubKey,
    privKey,
    outputHashBuffer.slice(0, sodium.crypto_sign_SEEDBYTES),
  )

  return [pubKey, privKey]
}

const SecretKeyCryptographyCreateKey = (salt: string, password: string): Buffer[] => {
  const configLoginAppSecret = Buffer.from(CONFIG.LOGIN_APP_SECRET, 'hex')
  const configLoginServerKey = Buffer.from(CONFIG.LOGIN_SERVER_KEY, 'hex')
  if (configLoginServerKey.length !== sodium.crypto_shorthash_KEYBYTES) {
    throw new Error(
      `ServerKey has an invalid size. The size must be ${sodium.crypto_shorthash_KEYBYTES} bytes.`,
    )
  }

  const state = Buffer.alloc(sodium.crypto_hash_sha512_STATEBYTES)
  sodium.crypto_hash_sha512_init(state)
  sodium.crypto_hash_sha512_update(state, Buffer.from(salt))
  sodium.crypto_hash_sha512_update(state, configLoginAppSecret)
  const hash = Buffer.alloc(sodium.crypto_hash_sha512_BYTES)
  sodium.crypto_hash_sha512_final(state, hash)

  const encryptionKey = Buffer.alloc(sodium.crypto_box_SEEDBYTES)
  const opsLimit = 10
  const memLimit = 33554432
  const algo = 2
  sodium.crypto_pwhash(
    encryptionKey,
    Buffer.from(password),
    hash.slice(0, sodium.crypto_pwhash_SALTBYTES),
    opsLimit,
    memLimit,
    algo,
  )

  const encryptionKeyHash = Buffer.alloc(sodium.crypto_shorthash_BYTES)
  sodium.crypto_shorthash(encryptionKeyHash, encryptionKey, configLoginServerKey)

  return [encryptionKeyHash, encryptionKey]
}

const getEmailHash = (email: string): Buffer => {
  const emailHash = Buffer.alloc(sodium.crypto_generichash_BYTES)
  sodium.crypto_generichash(emailHash, Buffer.from(email))
  return emailHash
}

const SecretKeyCryptographyEncrypt = (message: Buffer, encryptionKey: Buffer): Buffer => {
  const encrypted = Buffer.alloc(message.length + sodium.crypto_secretbox_MACBYTES)
  const nonce = Buffer.alloc(sodium.crypto_secretbox_NONCEBYTES)
  nonce.fill(31) // static nonce

  sodium.crypto_secretbox_easy(encrypted, message, nonce, encryptionKey)
  return encrypted
}

const SecretKeyCryptographyDecrypt = (encryptedMessage: Buffer, encryptionKey: Buffer): Buffer => {
  const message = Buffer.alloc(encryptedMessage.length - sodium.crypto_secretbox_MACBYTES)
  const nonce = Buffer.alloc(sodium.crypto_secretbox_NONCEBYTES)
  nonce.fill(31) // static nonce

  sodium.crypto_secretbox_open_easy(message, encryptedMessage, nonce, encryptionKey)

  return message
}

@Resolver()
export class UserResolver {
  @Query(() => User)
  @UseMiddleware(klicktippNewsletterStateMiddleware)
  async login(
    @Args() { email, password, publisherId }: UnsecureLoginArgs,
    @Ctx() context: any,
  ): Promise<User> {
    email = email.trim().toLowerCase()
    // const result = await apiPost(CONFIG.LOGIN_API_URL + 'unsecureLogin', { email, password })
    // UnsecureLogin
    const loginUserRepository = getCustomRepository(LoginUserRepository)
    const loginUser = await loginUserRepository.findByEmail(email).catch(() => {
      throw new Error('No user with this credentials')
    })
    const passwordHash = SecretKeyCryptographyCreateKey(email, password) // return short and long hash
    const loginUserPassword = BigInt(loginUser.password.toString())
    if (loginUserPassword !== passwordHash[0].readBigUInt64LE()) {
      throw new Error('No user with this credentials')
    }
    // TODO: If user has no pubKey Create it again and update user.

    const userRepository = getCustomRepository(UserRepository)
    let userEntity: void | DbUser
    const loginUserPubKey = loginUser.pubKey
    const loginUserPubKeyString = loginUserPubKey.toString('hex')
    userEntity = await userRepository.findByPubkeyHex(loginUserPubKeyString).catch(() => {
      // User not stored in state_users
      // TODO: Check with production data - email is unique which can cause problems
      userEntity = new DbUser()
      userEntity.firstName = loginUser.firstName
      userEntity.lastName = loginUser.lastName
      userEntity.username = loginUser.username
      userEntity.email = loginUser.email
      userEntity.pubkey = loginUser.pubKey

      userRepository.save(userEntity).catch(() => {
        throw new Error('error by save userEntity')
      })
    })
    if (!userEntity) {
      throw new Error('error with cannot happen')
    }

    const user = new User()
    user.email = email
    user.firstName = loginUser.firstName
    user.lastName = loginUser.lastName
    user.username = loginUser.username
    user.description = loginUser.description
    user.pubkey = loginUserPubKeyString
    user.language = loginUser.language

    // Elopage Status & Stored PublisherId
    user.hasElopage = await this.hasElopage({ pubKey: loginUserPubKeyString })
    if (!user.hasElopage && publisherId) {
      user.publisherId = publisherId
      // TODO: Check if we can use updateUserInfos
      // await this.updateUserInfos({ publisherId }, { pubKey: loginUser.pubKey })
      const loginUserRepository = getCustomRepository(LoginUserRepository)
      const loginUser = await loginUserRepository.findOneOrFail({ email: userEntity.email })
      loginUser.publisherId = publisherId
      loginUserRepository.save(loginUser)
    }

    // coinAnimation
    const userSettingRepository = getCustomRepository(UserSettingRepository)
    const coinanimation = await userSettingRepository
      .readBoolean(userEntity.id, Setting.COIN_ANIMATION)
      .catch((error) => {
        throw new Error(error)
      })
    user.coinanimation = coinanimation

    context.setHeaders.push({
      key: 'token',
      value: encode(loginUser.pubKey),
    })

    return user
  }

  @Query(() => LoginViaVerificationCode)
  async loginViaEmailVerificationCode(
    @Arg('optin') optin: string,
  ): Promise<LoginViaVerificationCode> {
    // I cannot use number as type here.
    // The value received is not the same as sent by the query
    const result = await apiGet(
      CONFIG.LOGIN_API_URL + 'loginViaEmailVerificationCode?emailVerificationCode=' + optin,
    )
    if (!result.success) {
      throw new Error(result.data)
    }
    return new LoginViaVerificationCode(result.data)
  }

  @Authorized()
  @Query(() => String)
  async logout(): Promise<boolean> {
    // TODO: We dont need this anymore, but might need this in the future in oder to invalidate a valid JWT-Token.
    // Furthermore this hook can be useful for tracking user behaviour (did he logout or not? Warn him if he didn't on next login)
    // The functionality is fully client side - the client just needs to delete his token with the current implementation.
    // we could try to force this by sending `token: null` or `token: ''` with this call. But since it bares no real security
    // we should just return true for now.
    return true
  }

  @Mutation(() => String)
  async createUser(
    @Args() { email, firstName, lastName, password, language, publisherId }: CreateUserArgs,
  ): Promise<string> {
    // TODO: wrong default value (should be null), how does graphql work here? Is it an required field?
    // default int publisher_id = 0;

    // Validate Language (no throw)
    if (!isLanguage(language)) {
      language = DEFAULT_LANGUAGE
    }

    // Validate Password
    if (!isPassword(password)) {
      throw new Error(
        'Please enter a valid password with at least 8 characters, upper and lower case letters, at least one number and one special character!',
      )
    }

    // Validate username
    // TODO: never true
    const username = ''
    if (username.length > 3 && !this.checkUsername({ username })) {
      throw new Error('Username already in use')
    }

    // Validate email unique
    // TODO: i can register an email in upper/lower case twice
    const userRepository = getCustomRepository(UserRepository)
    const usersFound = await userRepository.count({ email })
    if (usersFound !== 0) {
      // TODO: this is unsecure, but the current implementation of the login server. This way it can be queried if the user with given EMail is existent.
      throw new Error(`User already exists.`)
    }

    const passphrase = PassphraseGenerate()
    const keyPair = KeyPairEd25519Create(passphrase) // return pub, priv Key
    const passwordHash = SecretKeyCryptographyCreateKey(email, password) // return short and long hash
    const emailHash = getEmailHash(email)
    const encryptedPrivkey = SecretKeyCryptographyEncrypt(keyPair[1], passwordHash[1])

    // Table: login_users
    const loginUser = new LoginUser()
    loginUser.email = email
    loginUser.firstName = firstName
    loginUser.lastName = lastName
    loginUser.username = username
    loginUser.description = ''
    loginUser.password = passwordHash[0].readBigUInt64LE() // using the shorthash
    loginUser.emailHash = emailHash
    loginUser.language = language
    loginUser.groupId = 1
    loginUser.publisherId = publisherId
    loginUser.pubKey = keyPair[0]
    loginUser.privKey = encryptedPrivkey

    const queryRunner = getConnection().createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction('READ UNCOMMITTED')
    try {
      const { id: loginUserId } = await queryRunner.manager.save(loginUser).catch((error) => {
        // eslint-disable-next-line no-console
        console.log('insert LoginUser failed', error)
        throw new Error('insert user failed')
      })

      // Table: login_user_backups
      const loginUserBackup = new LoginUserBackup()
      loginUserBackup.userId = loginUserId
      loginUserBackup.passphrase = passphrase.join(' ') + ' ' // login server saves trailing space
      loginUserBackup.mnemonicType = 2 // ServerConfig::MNEMONIC_BIP0039_SORTED_ORDER;

      await queryRunner.manager.save(loginUserBackup).catch((error) => {
        // eslint-disable-next-line no-console
        console.log('insert LoginUserBackup failed', error)
        throw new Error('insert user backup failed')
      })

      // Table: state_users
      const dbUser = new DbUser()
      dbUser.pubkey = keyPair[0]
      dbUser.email = email
      dbUser.firstName = firstName
      dbUser.lastName = lastName
      dbUser.username = username

      await queryRunner.manager.save(dbUser).catch((er) => {
        // eslint-disable-next-line no-console
        console.log('Error while saving dbUser', er)
        throw new Error('error saving user')
      })

      // Store EmailOptIn in DB
      const emailOptIn = new LoginEmailOptIn()
      emailOptIn.userId = loginUserId
      emailOptIn.verificationCode = random(64)
      emailOptIn.emailOptInTypeId = 2

      await queryRunner.manager.save(emailOptIn).catch((error) => {
        // eslint-disable-next-line no-console
        console.log('Error while saving emailOptIn', error)
        throw new Error('error saving email opt in')
      })

      // Send EMail to user
      const activationLink = CONFIG.EMAIL_LINK_VERIFICATION.replace(
        /\$1/g,
        emailOptIn.verificationCode.toString(),
      )
      const emailSent = await sendEMail({
        from: `Gradido (nicht antworten) <${CONFIG.EMAIL_SENDER}>`,
        to: `${firstName} ${lastName} <${email}>`,
        subject: 'Gradido: E-Mail Überprüfung',
        text: `Hallo ${firstName} ${lastName},
        
        Deine EMail wurde soeben bei Gradido registriert.
        
        Klicke bitte auf diesen Link, um die Registrierung abzuschließen und dein Gradido-Konto zu aktivieren:
        ${activationLink}
        oder kopiere den obigen Link in dein Browserfenster.
        
        Mit freundlichen Grüßen,
        dein Gradido-Team`,
      })

      // In case EMails are disabled log the activation link for the user
      if (!emailSent) {
        // eslint-disable-next-line no-console
        console.log(`Account confirmation link: ${activationLink}`)
      }
      await queryRunner.commitTransaction()
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }
    return 'success'
  }

  @Query(() => SendPasswordResetEmailResponse)
  async sendResetPasswordEmail(
    @Arg('email') email: string,
  ): Promise<SendPasswordResetEmailResponse> {
    const payload = {
      email,
      email_text: 7,
      email_verification_code_type: 'resetPassword',
    }
    const response = await apiPost(CONFIG.LOGIN_API_URL + 'sendEmail', payload)
    if (!response.success) {
      throw new Error(response.data)
    }
    return new SendPasswordResetEmailResponse(response.data)
  }

  @Mutation(() => String)
  async resetPassword(
    @Args()
    { sessionId, email, password }: ChangePasswordArgs,
  ): Promise<string> {
    const payload = {
      session_id: sessionId,
      email,
      password,
    }
    const result = await apiPost(CONFIG.LOGIN_API_URL + 'resetPassword', payload)
    if (!result.success) {
      throw new Error(result.data)
    }
    return 'success'
  }

  @Authorized()
  @Mutation(() => Boolean)
  async updateUserInfos(
    @Args()
    {
      firstName,
      lastName,
      description,
      username,
      language,
      publisherId,
      password,
      passwordNew,
      coinanimation,
    }: UpdateUserInfosArgs,
    @Ctx() context: any,
  ): Promise<boolean> {
    const userRepository = getCustomRepository(UserRepository)
    const userEntity = await userRepository.findByPubkeyHex(context.pubKey)
    const loginUserRepository = getCustomRepository(LoginUserRepository)
    const loginUser = await loginUserRepository.findOneOrFail({ email: userEntity.email })

    if (username) {
      throw new Error('change username currently not supported!')
      // TODO: this error was thrown on login_server whenever you tried to change the username
      // to anything except "" which is an exception to the rules below. Those were defined
      // aswell, even tho never used.
      // ^[a-zA-Z][a-zA-Z0-9_-]*$
      // username must start with [a-z] or [A-Z] and than can contain also [0-9], - and _
      // username already used
      // userEntity.username = username
    }

    if (firstName) {
      loginUser.firstName = firstName
      userEntity.firstName = firstName
    }

    if (lastName) {
      loginUser.lastName = lastName
      userEntity.lastName = lastName
    }

    if (description) {
      loginUser.description = description
    }

    if (language) {
      if (!isLanguage(language)) {
        throw new Error(`"${language}" isn't a valid language`)
      }
      loginUser.language = language
    }

    if (password && passwordNew) {
      // TODO: This had some error cases defined - like missing private key. This is no longer checked.
      const oldPasswordHash = SecretKeyCryptographyCreateKey(loginUser.email, password)
      if (loginUser.password !== oldPasswordHash[0].readBigUInt64LE()) {
        throw new Error(`Old password is invalid`)
      }

      const privKey = SecretKeyCryptographyDecrypt(loginUser.privKey, oldPasswordHash[1])

      const newPasswordHash = SecretKeyCryptographyCreateKey(loginUser.email, passwordNew) // return short and long hash
      const encryptedPrivkey = SecretKeyCryptographyEncrypt(privKey, newPasswordHash[1])

      // Save new password hash and newly encrypted private key
      loginUser.password = newPasswordHash[0].readBigInt64LE()
      loginUser.privKey = encryptedPrivkey
    }

    // Save publisherId only if Elopage is not yet registered
    if (publisherId && !(await this.hasElopage(context))) {
      loginUser.publisherId = publisherId
    }

    const queryRunner = getConnection().createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction('READ UNCOMMITTED')

    try {
      if (coinanimation) {
        queryRunner.manager
          .getCustomRepository(UserSettingRepository)
          .setOrUpdate(userEntity.id, Setting.COIN_ANIMATION, coinanimation.toString())
          .catch((error) => {
            throw new Error('error saving coinanimation: ' + error)
          })
      }

      await queryRunner.manager.save(loginUser).catch((error) => {
        throw new Error('error saving loginUser: ' + error)
      })

      await queryRunner.manager.save(userEntity).catch((error) => {
        throw new Error('error saving user: ' + error)
      })

      await queryRunner.commitTransaction()
    } catch (e) {
      await queryRunner.rollbackTransaction()
      throw e
    } finally {
      await queryRunner.release()
    }

    return true
  }

  @Query(() => Boolean)
  async checkUsername(@Args() { username }: CheckUsernameArgs): Promise<boolean> {
    // Username empty?
    if (username === '') {
      throw new Error('Username must be set.')
    }

    // Do we fullfil the minimum character length?
    const MIN_CHARACTERS_USERNAME = 2
    if (username.length < MIN_CHARACTERS_USERNAME) {
      throw new Error(`Username must be at minimum ${MIN_CHARACTERS_USERNAME} characters long.`)
    }

    const usersFound = await LoginUser.count({ username })

    // Username already present?
    if (usersFound !== 0) {
      throw new Error(`Username "${username}" already taken.`)
    }

    return true
  }

  @Query(() => CheckEmailResponse)
  @UseMiddleware(klicktippRegistrationMiddleware)
  async checkEmail(@Arg('optin') optin: string): Promise<CheckEmailResponse> {
    const result = await apiGet(
      CONFIG.LOGIN_API_URL + 'loginViaEmailVerificationCode?emailVerificationCode=' + optin,
    )
    if (!result.success) {
      throw new Error(result.data)
    }
    return new CheckEmailResponse(result.data)
  }

  @Authorized()
  @Query(() => Boolean)
  async hasElopage(@Ctx() context: any): Promise<boolean> {
    const userRepository = getCustomRepository(UserRepository)
    const userEntity = await userRepository.findByPubkeyHex(context.pubKey).catch()
    if (!userEntity) {
      return false
    }

    const loginElopageBuysRepository = getCustomRepository(LoginElopageBuysRepository)
    const elopageBuyCount = await loginElopageBuysRepository.count({ payerEmail: userEntity.email })
    return elopageBuyCount > 0
  }
}
