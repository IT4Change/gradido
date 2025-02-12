/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { ObjectType, Field, Float, Int } from 'type-graphql'

import { GdtEntryType } from '@enum/GdtEntryType'

@ObjectType()
export class GdtEntry {
  constructor(json: any) {
    this.id = json.id
    this.amount = json.amount
    this.date = json.date
    this.email = json.email
    this.comment = json.comment
    this.couponCode = json.coupon_code
    this.gdtEntryType = json.gdt_entry_type_id
    this.factor = json.factor
    this.amount2 = json.amount2
    this.factor2 = json.factor2
    this.gdt = json.gdt
  }

  @Field(() => Int)
  id: number

  @Field(() => Float)
  amount: number

  @Field(() => String)
  date: string

  @Field(() => String)
  email: string

  @Field(() => String)
  comment: string

  @Field(() => String)
  couponCode: string

  @Field(() => GdtEntryType)
  gdtEntryType: GdtEntryType

  @Field(() => Float)
  factor: number

  @Field(() => Float)
  amount2: number

  @Field(() => Float)
  factor2: number

  @Field(() => Float)
  gdt: number
}
