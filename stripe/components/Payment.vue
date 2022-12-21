<template>
  <div v-if="clientSecretStatus">
     <stripe-element-payment
      ref="paymentRef"
      :pk="publishableKey"
      :elements-options="elementsOptions"
      :confirm-params="confirmParams"
      :redirect="redirect"
      :createOptions="createOptions"
      @element-ready="validate"
    />
  </div>
</template>

<script lang="ts">
  import { ref, defineComponent, onMounted, useContext} from '@nuxtjs/composition-api';
  import { PaymentIntentOptions, StripeEvents } from '@headlesscommerce/vsf-magento-stripe/stripe/types';
  import usePaymentIntent from '@headlesscommerce/vsf-magento-stripe/stripe/composables/usePaymentIntent';
  import { StripeElementPayment } from '@vue-stripe/vue-stripe';

  // Relies on VSF MAGENTO to be installed
  import usePaymentProvider from '~/modules/checkout/composables/usePaymentProvider';
  import useCart from '~/modules/checkout/composables/useCart';

  export default defineComponent({
    name: 'Stripe',
    components: {
      StripeElementPayment
    },
    emits: ['status'],
    setup(_props, { emit }) {
      const { load, save } = usePaymentProvider();
      const paymentRef = ref(null);
      const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
      const paymentMethods = ref(null);
      const { cart } = useCart();
      const elementsOptions = ref<PaymentIntentOptions>();
      const confirmParams = ref(null);
      const redirect = 'if_required';
      const clientSecretStatus = ref(false);
      const billingDetails = ref(null);
      const { getClientSecret } = usePaymentIntent();
      const createOptions = {
        "fields": {
          "billingDetails": "never"
        }
      }

      onMounted(async () => {
        // Load payment methods for later access
        paymentMethods.value = await load();

        // VSF BUG https://github.com/vuestorefront/magento2/issues/1389
        const cartId = cart.value.id;
        if (!cartId) return;

        // Get client secret from Magento Stripe module
        const clientSecretResponse = await getClientSecret(cartId);
        elementsOptions.value = { clientSecret: clientSecretResponse };
        confirmParams.value = { return_url: window.location.origin + '/checkout/thank-you' };
        clientSecretStatus.value = true;
      });

      const setPaymentMethod = async () => {
        // Get payment method id from vue stripe element then save selected payment method
        const stripe = paymentRef.value.stripe;
        const elements = paymentRef.value.elements;

        const confirmPayment = await stripe.confirmPayment({
          //`Elements` instance that was used to create the Payment Element
          elements,
          redirect: 'if_required',
          confirmParams: {
            return_url: window.location.origin + '/checkout/thank-you',
            payment_method_data: {
              billing_details: {
                "address": {
                    "city": cart.value.billing_address.city,
                    "country": cart.value.billing_address.country.code,
                    "line1": cart.value.billing_address.street[0],
                    "line2": cart.value.billing_address.street[1] || "",
                    "postal_code": cart.value.billing_address.postcode,
                    "state": cart.value.billing_address.region.code
                  },
                "email": cart.value.email,
                "name": cart.value.billing_address.firstname + " " + cart.value.billing_address.lastname,
                "phone": cart.value.billing_address.telephone
              }
            }
          },
        });

        if (confirmPayment.error) {
          throw(confirmPayment.error);
        }

        if (confirmPayment.paymentIntent.status === "succeeded") {
          paymentMethods.value = await save({
            paymentMethod: {
              code: 'stripe_payments',
              stripe_payments: {
                cc_stripejs_token: confirmPayment.paymentIntent.payment_method,
              }
            }
          });
          return true;
        } else {
          return false;
        }
      }

      const validate = () => {
        // Check if all required fields for the selected payment method in the Payment Element have been filled with potentially valid input
        paymentRef.value.element.on('change', (event: StripeEvents) => {
          if (event.complete) {
            emit('status', event.complete);
          }
        });
      }

      return {
        paymentRef,
        publishableKey,
        elementsOptions,
        confirmParams,
        redirect,
        clientSecretStatus,
        billingDetails,
        validate,
        setPaymentMethod,
        createOptions
      }
    },
  });
</script>
