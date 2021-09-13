import { mount } from '@vue/test-utils'
import TransactionCollapse from './TransactionCollapse'

const localVue = global.localVue

describe('TransactionCollapse', () => {
  let wrapper

  const mocks = {
    $t: jest.fn((t) => t),
    $n: jest.fn((n) => n),
  }

  const Wrapper = (propsData) => {
    return mount(TransactionCollapse, { localVue, mocks, propsData })
  }

  describe('mount with gdtEntryType: 1', () => {
    beforeEach(() => {
      const propsData = {
        amount: 100,
        gdt: 110,
        factor: 22,
        gdtEntryType: 1,
      }

      wrapper = Wrapper(propsData)
    })

    it('renders the component', () => {
      expect(wrapper.find('div.gdt-transaction-collapse').exists()).toBeTruthy()
    })

    it('checks the prop gdtEntryType  ', () => {
      expect(wrapper.props().gdtEntryType).toBe(1)
    })

    it('renders the component clooaps-header', () => {
      expect(wrapper.find('.gdt-list-clooaps-header-text')).toBeTruthy()
    })

    it('renders the component clooaps-headline', () => {
      expect(wrapper.find('#clooaps-headline').text()).toBe('gdt.calculation')
    })

    it('renders the component clooaps-first', () => {
      expect(wrapper.find('#clooaps-first').text()).toBe('gdt.factor')
    })

    it('renders the component clooaps-second', () => {
      expect(wrapper.find('#clooaps-second').text()).toBe('gdt.formula')
    })

    it('renders the component clooaps-firstMath', () => {
      expect(wrapper.find('#clooaps-firstMath').text()).toBe('22 GDT pro €')
    })

    it('renders the component clooaps-secondMath', () => {
      expect(wrapper.find('#clooaps-secondMath').text()).toBe('100 € * 22 GDT / € = 110 GDT')
    })
  })

  describe('mount with gdtEntryType: 7', () => {
    beforeEach(() => {
      const propsData = {
        amount: 100,
        gdt: 2200,
        factor: 22,
        gdtEntryType: 7,
      }

      wrapper = Wrapper(propsData)
    })

    it('renders the component', () => {
      expect(wrapper.find('div.gdt-transaction-collapse').exists()).toBeTruthy()
    })

    it('checks the prop gdtEntryType  ', () => {
      expect(wrapper.props().gdtEntryType).toBe(7)
    })

    it('renders the component clooaps-header', () => {
      expect(wrapper.find('.gdt-list-clooaps-header-text')).toBeTruthy()
    })

    it('renders the component clooaps-headline', () => {
      expect(wrapper.find('#clooaps-headline').text()).toBe('gdt.conversion-gdt-euro')
    })

    it('renders the component clooaps-first', () => {
      expect(wrapper.find('#clooaps-first').text()).toBe('gdt.raise')
    })

    it('renders the component clooaps-second', () => {
      expect(wrapper.find('#clooaps-second').text()).toBe('gdt.conversion')
    })

    it('renders the component clooaps-firstMath', () => {
      expect(wrapper.find('#clooaps-firstMath').text()).toBe('2200 %')
    })

    it('renders the component clooaps-secondMath', () => {
      expect(wrapper.find('#clooaps-secondMath').text()).toBe('100 GDT * 2200 % = 2200 GDT')
    })
  })

  describe('mount with gdtEntryType: 4', () => {
    beforeEach(() => {
      const propsData = {
        amount: 100,
        gdt: 2200,
        factor: 22,
        gdtEntryType: 4,
      }

      wrapper = Wrapper(propsData)
    })

    it('renders the component', () => {
      expect(wrapper.find('div.gdt-transaction-collapse').exists()).toBeTruthy()
    })

    it('checks the prop gdtEntryType  ', () => {
      expect(wrapper.props().gdtEntryType).toBe(4)
    })

    it('renders the component clooaps-header', () => {
      expect(wrapper.find('.gdt-list-clooaps-header-text')).toBeTruthy()
    })

    it('renders the component clooaps-headline', () => {
      expect(wrapper.find('#clooaps-headline').text()).toBe('gdt.publisher')
    })

    it('renders the component clooaps-first', () => {
      expect(wrapper.find('#clooaps-first').text()).toBe('')
    })

    it('renders the component clooaps-second', () => {
      expect(wrapper.find('#clooaps-second').text()).toBe('')
    })

    it('renders the component clooaps-firstMath', () => {
      expect(wrapper.find('#clooaps-firstMath').text()).toBe('')
    })

    it('renders the component clooaps-secondMath', () => {
      expect(wrapper.find('#clooaps-secondMath').text()).toBe('')
    })
  })
})
