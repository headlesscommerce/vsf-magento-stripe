<template>
    <div>
      <SfRadio
        v-for="method in paymentMethods"
        :key="method.code"
        v-e2e="'payment-method'"
        :label="method.title"
        :value="method.code"
        :selected="selectedPaymentMethodCode"
        name="paymentMethod"
        class="form__radio payment"
        @input="definePaymentMethods(method.code)"
      >
        <div class="payment__label">
          {{ method.title }}
        </div>
        <template #details>
          <Stripe ref="StripeRef" v-if="method.code === 'stripe_payments'" @status="paymentStatus" />
        </template>
      </SfRadio>
    </div>
  </template>
  
<script lang="ts">
  import { SfRadio } from '@storefront-ui/vue';
  import { ref, onMounted, defineComponent } from '@nuxtjs/composition-api';
  import usePaymentProvider from '~/modules/checkout/composables/usePaymentProvider';
  import type { AvailablePaymentMethod } from '~/modules/GraphQL/types';
  
  export default defineComponent({
    name: 'VsfPaymentProvider',
    components: {
      SfRadio,
      Stripe: () => import('~/stripe/components/payment.vue')
    },
    emits: ['status'],
    setup(_props, { emit }) {
      const paymentMethods = ref<AvailablePaymentMethod[]>([]);
      const { load, save } = usePaymentProvider();
      const selectedPaymentMethodCode = ref<string | null>(null);
      const StripeRef = ref(null);
  
      onMounted(async () => {
        paymentMethods.value = await load();
      });
  
      const definePaymentMethods = async (paymentMethodCode: string) => {
        paymentMethods.value = await save({
          paymentMethod: {
            code: paymentMethodCode,
          },
        });
        
        selectedPaymentMethodCode.value = paymentMethodCode;
  
        if (paymentMethodCode !== 'stripe_payments') {
          emit('status', paymentMethodCode);
        }
      };
  
      // Validate and initiate stripe setPaymentMethod function
      const triggerStripe = () => {
        if (selectedPaymentMethodCode.value == 'stripe_payments') {
          return StripeRef.value[0].setPaymentMethod();
        } else {
          return;
        }
      }
      const paymentStatus = () => {
        emit('status', 'true');
      };
  
      return {
        paymentMethods,
        paymentStatus,
        triggerStripe,
        selectedPaymentMethodCode,
        definePaymentMethods,
        StripeRef
      };
    },
  });
</script>

  