import { RIGHTS } from '@/auth/RIGHTS'
import { Context, getUser } from '@/server/context'
import { backendLogger as logger } from '@/server/logger'
import { Contribution as dbContribution } from '@entity/Contribution'
import { Arg, Args, Authorized, Ctx, Int, Mutation, Query, Resolver } from 'type-graphql'
import { IsNull } from '../../../../database/node_modules/typeorm'
import ContributionArgs from '../arg/ContributionArgs'
import Paginated from '../arg/Paginated'
import { Order } from '../enum/Order'
import { Contribution } from '../model/Contribution'
import { UnconfirmedContribution } from '../model/UnconfirmedContribution'
import { User } from '../model/User'
import { validateContribution, getUserCreation, updateCreations } from './util/creations'

@Resolver()
export class ContributionResolver {
  @Authorized([RIGHTS.CREATE_CONTRIBUTION])
  @Mutation(() => UnconfirmedContribution)
  async createContribution(
    @Args() { amount, memo, creationDate }: ContributionArgs,
    @Ctx() context: Context,
  ): Promise<UnconfirmedContribution> {
    const user = getUser(context)
    const creations = await getUserCreation(user.id)
    logger.trace('creations', creations)
    const creationDateObj = new Date(creationDate)
    validateContribution(creations, amount, creationDateObj)

    const contribution = dbContribution.create()
    contribution.userId = user.id
    contribution.amount = amount
    contribution.createdAt = new Date()
    contribution.contributionDate = creationDateObj
    contribution.memo = memo

    logger.trace('contribution to save', contribution)
    await dbContribution.save(contribution)
    return new UnconfirmedContribution(contribution, user, creations)
  }

  @Authorized([RIGHTS.LIST_CONTRIBUTIONS])
  @Query(() => [Contribution])
  async listContributions(
    @Args()
    { currentPage = 1, pageSize = 5, order = Order.DESC }: Paginated,
    @Arg('filterConfirmed', () => Boolean)
    filterConfirmed: boolean | null,
    @Ctx() context: Context,
  ): Promise<Contribution[]> {
    const user = getUser(context)
    let contribution
    if (filterConfirmed) {
      contribution = await dbContribution.find({
        where: {
          userId: user.id,
          confirmedBy: IsNull(),
        },
        order: {
          createdAt: order,
        },
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
      })
    } else {
      contribution = await dbContribution.find({
        where: {
          userId: user.id,
        },
        order: {
          createdAt: order,
        },
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
      })
    }
    return contribution.map((contr) => new Contribution(contr, new User(user)))
  }

  @Authorized([RIGHTS.UPDATE_CONTRIBUTION])
  @Mutation(() => UnconfirmedContribution)
  async updateContribution(
    @Arg('contributionId', () => Int)
    contributionId: number,
    @Args() { amount, memo, creationDate }: ContributionArgs,
    @Ctx() context: Context,
  ): Promise<UnconfirmedContribution> {
    const user = getUser(context)

    const contributionToUpdate = await dbContribution.findOne({
      where: { id: contributionId, confirmedAt: IsNull() },
    })
    if (!contributionToUpdate) {
      throw new Error('No contribution found to given id.')
    }
    if (contributionToUpdate.userId !== user.id) {
      throw new Error('user of the pending contribution and send user does not correspond')
    }

    const creationDateObj = new Date(creationDate)
    let creations = await getUserCreation(user.id)
    if (contributionToUpdate.contributionDate.getMonth() === creationDateObj.getMonth()) {
      creations = updateCreations(creations, contributionToUpdate)
    }

    // all possible cases not to be true are thrown in this function
    validateContribution(creations, amount, creationDateObj)
    contributionToUpdate.amount = amount
    contributionToUpdate.memo = memo
    contributionToUpdate.contributionDate = new Date(creationDate)
    dbContribution.save(contributionToUpdate)

    return new UnconfirmedContribution(contributionToUpdate, user, creations)
  }
}
