import { Brackets, EntityRepository, IsNull, Not, Repository } from '@dbTools/typeorm'
import { User as DbUser } from '@entity/User'

import { SearchUsersFilters } from '@arg/SearchUsersFilters'
import { Order } from '@enum/Order'

@EntityRepository(DbUser)
export class UserRepository extends Repository<DbUser> {
  async findBySearchCriteriaPagedFiltered(
    select: string[],
    searchCriteria: string,
    filters: SearchUsersFilters | null,
    currentPage: number,
    pageSize: number,
    order = Order.ASC,
  ): Promise<[DbUser[], number]> {
    const query = this.createQueryBuilder('user')
      .select(select)
      .withDeleted()
      .leftJoinAndSelect('user.emailContact', 'emailContact')
      .where(
        new Brackets((qb) => {
          qb.where(
            'user.firstName like :name or user.lastName like :lastName or emailContact.email like :email',
            {
              name: `%${searchCriteria}%`,
              lastName: `%${searchCriteria}%`,
              email: `%${searchCriteria}%`,
            },
          )
        }),
      )
    /*
    filterCriteria.forEach((filter) => {
      query.andWhere(filter)
    })
    */
    if (filters) {
      if (filters.byActivated !== null) {
        query.andWhere('emailContact.emailChecked = :value', { value: filters.byActivated })
        // filterCriteria.push({ 'emailContact.emailChecked': filters.byActivated })
      }

      if (filters.byDeleted !== null) {
        // filterCriteria.push({ deletedAt: filters.byDeleted ? Not(IsNull()) : IsNull() })
        query.andWhere({ deletedAt: filters.byDeleted ? Not(IsNull()) : IsNull() })
      }
    }

    return query
      .orderBy({ 'user.id': order })
      .take(pageSize)
      .skip((currentPage - 1) * pageSize)
      .getManyAndCount()
  }
}
