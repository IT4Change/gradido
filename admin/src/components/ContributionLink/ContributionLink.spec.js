import { mount } from '@vue/test-utils'
import ContributionLink from './ContributionLink.vue'

const localVue = global.localVue

const mocks = {
  $t: jest.fn((t) => t),
  $d: jest.fn((d) => d),
}

const propsData = {
  items: [
    {
      id: 1,
      name: 'Meditation',
      memo: 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut l',
      amount: '200',
      validFrom: '2022-04-01',
      validTo: '2022-08-01',
      cycle: 'täglich',
      maxPerCycle: '3',
      maxAmountPerMonth: 0,
      link: 'https://localhost/redeem/CL-1a2345678',
    },
  ],
  count: 1,
}

describe('ContributionLink', () => {
  let wrapper

  const Wrapper = () => {
    return mount(ContributionLink, { localVue, mocks, propsData })
  }

  describe('mount', () => {
    beforeEach(() => {
      wrapper = Wrapper()
    })

    it('renders the Div Element ".contribution-link"', () => {
      expect(wrapper.find('div.contribution-link').exists()).toBe(true)
    })

    describe('function editContributionLinkData', () => {
      beforeEach(() => {
        wrapper.vm.editContributionLinkData()
      })
      it('emits toggle::collapse new Contribution', async () => {
        await expect(wrapper.vm.$root.$emit('bv::toggle::collapse', 'newContribution')).toBeTruthy()
      })
    })

    describe('function closeContributionForm', () => {
      beforeEach(async () => {
        await wrapper.setData({ visible: true })
        wrapper.vm.closeContributionForm()
      })

      it('emits toggle::collapse close Contribution-Form ', async () => {
        await expect(wrapper.vm.$root.$emit('bv::toggle::collapse', 'newContribution')).toBeTruthy()
      })
      it('editContributionLink is false', async () => {
        await expect(wrapper.vm.editContributionLink).toBe(false)
      })
      it('contributionLinkData is empty', async () => {
        await expect(wrapper.vm.contributionLinkData).toEqual({})
      })
    })
  })
})
