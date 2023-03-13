/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { ObjectType, Field, Int } from 'type-graphql'

@ObjectType()
export class Community {
  constructor(json?: any) {
    if (json) {
      this.id = Number(json.id)
      this.name = json.name
      this.url = json.url
      this.description = json.description
      this.registerUrl = json.registerUrl
    }
  }

  @Field(() => Int)
  id: number

  @Field(() => String)
  name: string

  @Field(() => String)
  url: string

  @Field(() => String)
  description: string

  @Field(() => String)
  registerUrl: string
}
