import Decimal from 'decimal.js-light'
import { UserInterface } from '../../interface/UserInterface'

export const bobBaumeister: UserInterface = {
  email: 'bob@baumeister.de',
  firstName: 'Bob',
  lastName: 'der Baumeister',
  // description: 'Können wir das schaffen? Ja, wir schaffen das!',
  password: BigInt('3296644341468822636'),
  pubKey: Buffer.from('a509d9a146374fc975e3677db801ae8a4a83bff9dea96da64053ff6de6b2dd7e', 'hex'),
  privKey: Buffer.from(
    'd30606ac59c29058896180bebd6dcd1714dbdd697cc14b65eb4de9ef5241a5d5fc789eaab48957a887c45b7e71ab75c47fd132c14b99007891b5bdfb1026575009f0802b0126930803c113ab3f44e1be',
    'hex',
  ),
  emailHash: Buffer.from('4b8ce4e175587aaf33da19e272719da1a547daff557820191fab0c65c5a3b7f1', 'hex'),
  createdAt: new Date('2021-11-26T11:36:31'),
  emailChecked: true,
  language: 'de',
  passphrase:
    'detail master source effort unable waste tilt flush domain orchard art truck hint barrel response gate impose peanut secret merry three uncle wink resource ',
  isAdmin: false,
  addBalance: true,
  recordDate: new Date('2021-11-30T10:37:14'),
  creationDate: new Date('2021-08-01 00:00:00'),
  amount: new Decimal(1000),
}
