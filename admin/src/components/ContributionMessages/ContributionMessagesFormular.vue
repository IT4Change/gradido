<template>
  <div class="contribution-messages-formular">
    <div class="mt-5">
      <b-form @submit.prevent="onSubmit" @reset.prevent="onReset">
        <b-form-textarea
          id="textarea"
          v-model="form.text"
          :placeholder="$t('contributionLink.memo')"
          rows="3"
        ></b-form-textarea>
        <b-row class="mt-4 mb-6">
          <b-col>
            <b-button type="reset" variant="danger">{{ $t('form.cancel') }}</b-button>
          </b-col>
          <b-col class="text-right">
            <b-button type="submit" variant="primary" :disabled="disabled">
              {{ $t('form.submit') }}
            </b-button>
          </b-col>
        </b-row>
      </b-form>
    </div>
  </div>
</template>
<script>
import { adminCreateContributionMessage } from '@/graphql/adminCreateContributionMessage'

export default {
  name: 'ContributionMessagesFormular',
  props: {
    contributionId: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      form: {
        text: '',
      },
      loading: false,
    }
  },
  methods: {
    onSubmit(event) {
      this.loading = true
      this.$apollo
        .mutate({
          mutation: adminCreateContributionMessage,
          variables: {
            contributionId: this.contributionId,
            message: this.form.text,
          },
        })
        .then((result) => {
          this.$emit('get-list-contribution-messages', this.contributionId)
          this.$emit('update-state', this.contributionId)
          this.form.text = ''
          this.toastSuccess(this.$t('message.request'))
          this.loading = false
        })
        .catch((error) => {
          this.toastError(error.message)
          this.loading = false
        })
    },
    onReset(event) {
      this.form.text = ''
    },
  },
  computed: {
    disabled() {
      return this.form.text === '' || this.loading
    },
  },
}
</script>
