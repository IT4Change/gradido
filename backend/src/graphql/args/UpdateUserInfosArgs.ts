import { ArgsType, Field } from 'type-graphql'

@ArgsType()
export default class UpdateUserInfosArgs {
  @Field(() => String)
  email!: string

  @Field({ nullable: true })
  firstName?: string

  @Field({ nullable: true })
  lastName?: string

  @Field({ nullable: true })
  description?: string

  @Field({ nullable: true })
  username?: string

  @Field({ nullable: true })
  language?: string

  @Field({ nullable: true })
  publisherId?: number

  @Field({ nullable: true })
  password?: string

  @Field({ nullable: true })
  passwordNew?: string
}
