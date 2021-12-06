import { Resolver, Query, Arg, Args, Authorized, Mutation } from 'type-graphql'
import { getCustomRepository, Raw } from 'typeorm'
import { UserAdmin } from '../model/UserAdmin'
import { PendingCreation } from '../model/PendingCreation'
import { UpdatePendingCreation } from '../model/UpdatePendingCreation'
import { RIGHTS } from '../../auth/RIGHTS'
import { TransactionCreationRepository } from '../../typeorm/repository/TransactionCreation'
import { PendingCreationRepository } from '../../typeorm/repository/PendingCreation'
import { UserRepository } from '../../typeorm/repository/User'
import CreatePendingCreationArgs from '../arg/CreatePendingCreationArgs'
import UpdatePendingCreationArgs from '../arg/UpdatePendingCreationArgs'
import moment from 'moment'
import { LoginPendingTasksAdmin } from '@entity/LoginPendingTasksAdmin'

@Resolver()
export class AdminResolver {
  @Authorized([RIGHTS.SEARCH_USERS])
  @Query(() => [UserAdmin])
  async searchUsers(@Arg('searchText') searchText: string): Promise<UserAdmin[]> {
    const userRepository = getCustomRepository(UserRepository)
    const users = await userRepository.findBySearchCriteria(searchText)
    const adminUsers = await Promise.all(
      users.map(async (user) => {
        const adminUser = new UserAdmin()
        adminUser.firstName = user.firstName
        adminUser.lastName = user.lastName
        adminUser.email = user.email
        adminUser.creation = await getUserCreations(user.id)
        return adminUser
      }),
    )
    return adminUsers
  }

  @Authorized([RIGHTS.SEARCH_USERS])
  @Mutation(() => [Number])
  async createPendingCreation(
    @Args() { email, amount, memo, creationDate, moderator }: CreatePendingCreationArgs,
  ): Promise<number[]> {
    const userRepository = getCustomRepository(UserRepository)
    const user = await userRepository.findByEmail(email)

    const creations = await getUserCreations(user.id)
    const creationDateObj = new Date(creationDate)
    if (isCreationValid(creations, amount, creationDateObj)) {
      const pendingCreationRepository = getCustomRepository(PendingCreationRepository)
      const loginPendingTaskAdmin = pendingCreationRepository.create()
      loginPendingTaskAdmin.userId = user.id
      loginPendingTaskAdmin.amount = BigInt(amount * 10000)
      loginPendingTaskAdmin.created = new Date()
      loginPendingTaskAdmin.date = creationDateObj
      loginPendingTaskAdmin.memo = memo
      loginPendingTaskAdmin.moderator = moderator

      pendingCreationRepository.save(loginPendingTaskAdmin)
    }
    return await getUserCreations(user.id)
  }

  // @Authorized([RIGHTS.SEARCH_USERS])
  @Mutation(() => UpdatePendingCreation)
  async updatePendingCreation(
    @Args() { id, email, amount, memo, creationDate, moderator }: UpdatePendingCreationArgs,
  ): Promise<UpdatePendingCreation> {
    const userRepository = getCustomRepository(UserRepository)
    const user = await userRepository.findByEmail(email)

    const pendingCreationRepository = getCustomRepository(PendingCreationRepository)
    const updatedCreation = await pendingCreationRepository.findOneOrFail({ id })

    if (updatedCreation.userId !== user.id)
      throw new Error('user of the pending creation and send user does not correspond')

    updatedCreation.amount = BigInt(amount * 10000)
    updatedCreation.memo = memo
    updatedCreation.date = new Date(creationDate)
    updatedCreation.moderator = moderator

    await pendingCreationRepository.save(updatedCreation)
    const result = new UpdatePendingCreation()
    result.amount = parseInt(updatedCreation.amount.toString())
    result.memo = updatedCreation.memo
    result.date = updatedCreation.date
    result.moderator = updatedCreation.moderator
    result.creation = await getUserCreations(user.id)

    return result

    // const creations = await getUserCreations(user.id)
    // const creationDateObj = new Date(creationDate)
    // if (isCreationValid(creations, amount, creationDateObj)) {
    //   const pendingCreationRepository = getCustomRepository(PendingCreationRepository)
    //   const loginPendingTaskAdmin = pendingCreationRepository.create()
    //   loginPendingTaskAdmin.userId = user.id
    //   loginPendingTaskAdmin.amount = BigInt(amount * 10000)
    //   loginPendingTaskAdmin.created = new Date()
    //   loginPendingTaskAdmin.date = creationDateObj
    //   loginPendingTaskAdmin.memo = memo
    //   loginPendingTaskAdmin.moderator = moderator
    //
    //   pendingCreationRepository.save(loginPendingTaskAdmin)
    // }
    // return await getUserCreations(user.id)
  }

  @Query(() => [PendingCreation])
  async getPendingCreations(): Promise<PendingCreation[]> {
    const pendingCreationRepository = getCustomRepository(PendingCreationRepository)
    const pendingCreations = await pendingCreationRepository.find()

    const pendingCreationsPromise = await Promise.all(
      pendingCreations.map(async (pendingCreation) => {
        const userRepository = getCustomRepository(UserRepository)
        const user = await userRepository.findOneOrFail({ id: pendingCreation.userId })

        const newPendingCreation = {
          ...pendingCreation,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          creation: await getUserCreations(user.id),
        }

        return newPendingCreation
      }),
    )
    return pendingCreationsPromise
  }

  @Mutation(() => Boolean)
  async deletePendingCreation(@Arg('id') id: number): Promise<boolean> {
    const pendingCreationRepository = getCustomRepository(PendingCreationRepository)
    const entity = await pendingCreationRepository.findOneOrFail(id)
    const res = await pendingCreationRepository.delete(entity)
    return !!res
  }
}

async function getUserCreations(id: number): Promise<number[]> {
  const dateNextMonth = moment().add(1, 'month').format('YYYY-MM') + '-01'
  const dateMonth = moment().format('YYYY-MM') + '-01'
  const dateLastMonth = moment().subtract(1, 'month').format('YYYY-MM') + '-01'
  const dateBeforeLastMonth = moment().subtract(2, 'month').format('YYYY-MM') + '-01'

  const transactionCreationRepository = getCustomRepository(TransactionCreationRepository)
  const createdAmountBeforeLastMonth = await transactionCreationRepository
    .createQueryBuilder('transaction_creations')
    .select('SUM(transaction_creations.amount)', 'sum')
    .where('transaction_creations.state_user_id = :id', { id })
    .andWhere({
      targetDate: Raw((alias) => `${alias} >= :date and ${alias} < :enddate`, {
        date: dateBeforeLastMonth,
        enddate: dateLastMonth,
      }),
    })
    .getRawOne()

  const createdAmountLastMonth = await transactionCreationRepository
    .createQueryBuilder('transaction_creations')
    .select('SUM(transaction_creations.amount)', 'sum')
    .where('transaction_creations.state_user_id = :id', { id })
    .andWhere({
      targetDate: Raw((alias) => `${alias} >= :date and ${alias} < :enddate`, {
        date: dateLastMonth,
        enddate: dateMonth,
      }),
    })
    .getRawOne()

  const createdAmountMonth = await transactionCreationRepository
    .createQueryBuilder('transaction_creations')
    .select('SUM(transaction_creations.amount)', 'sum')
    .where('transaction_creations.state_user_id = :id', { id })
    .andWhere({
      targetDate: Raw((alias) => `${alias} >= :date and ${alias} < :enddate`, {
        date: dateMonth,
        enddate: dateNextMonth,
      }),
    })
    .getRawOne()

  const pendingCreationRepository = getCustomRepository(PendingCreationRepository)
  const pendingAmountMounth = await pendingCreationRepository
    .createQueryBuilder('login_pending_tasks_admin')
    .select('SUM(login_pending_tasks_admin.amount)', 'sum')
    .where('login_pending_tasks_admin.userId = :id', { id })
    .andWhere({
      date: Raw((alias) => `${alias} >= :date and ${alias} < :enddate`, {
        date: dateMonth,
        enddate: dateNextMonth,
      }),
    })
    .getRawOne()

  const pendingAmountLastMounth = await pendingCreationRepository
    .createQueryBuilder('login_pending_tasks_admin')
    .select('SUM(login_pending_tasks_admin.amount)', 'sum')
    .where('login_pending_tasks_admin.userId = :id', { id })
    .andWhere({
      date: Raw((alias) => `${alias} >= :date and ${alias} < :enddate`, {
        date: dateLastMonth,
        enddate: dateMonth,
      }),
    })
    .getRawOne()

  const pendingAmountBeforeLastMounth = await pendingCreationRepository
    .createQueryBuilder('login_pending_tasks_admin')
    .select('SUM(login_pending_tasks_admin.amount)', 'sum')
    .where('login_pending_tasks_admin.userId = :id', { id })
    .andWhere({
      date: Raw((alias) => `${alias} >= :date and ${alias} < :enddate`, {
        date: dateBeforeLastMonth,
        enddate: dateLastMonth,
      }),
    })
    .getRawOne()

  // COUNT amount from 2 tables
  const usedCreationBeforeLastMonth =
    (Number(createdAmountBeforeLastMonth.sum) + Number(pendingAmountBeforeLastMounth.sum)) / 10000
  const usedCreationLastMonth =
    (Number(createdAmountLastMonth.sum) + Number(pendingAmountLastMounth.sum)) / 10000
  const usedCreationMonth =
    (Number(createdAmountMonth.sum) + Number(pendingAmountMounth.sum)) / 10000
  return [
    1000 - usedCreationBeforeLastMonth,
    1000 - usedCreationLastMonth,
    1000 - usedCreationMonth,
  ]
}

function isCreationValid(creations: number[], amount: number, creationDate: Date) {
  const dateMonth = moment().format('YYYY-MM')
  const dateLastMonth = moment().subtract(1, 'month').format('YYYY-MM')
  const dateBeforeLastMonth = moment().subtract(2, 'month').format('YYYY-MM')
  const creationDateMonth = moment(creationDate).format('YYYY-MM')

  let openCreation
  switch (creationDateMonth) {
    case dateMonth:
      openCreation = creations[2]
      break
    case dateLastMonth:
      openCreation = creations[1]
      break
    case dateBeforeLastMonth:
      openCreation = creations[0]
      break
    default:
      throw new Error('CreationDate is not in last three months')
  }

  if (openCreation < amount) {
    throw new Error(`Open creation (${openCreation}) is less than amount (${amount})`)
  }
  return true
}
