<template>
  <div ref="paymentElementRef"></div>
</template>
<script>
  import { ref, onMounted, defineComponent, useContext } from '@nuxtjs/composition-api';

  // Relies on VSF MAGENTO to be installed
  import usePaymentProvider from '~/modules/checkout/composables/usePaymentProvider';
  import useCart from '~/modules/checkout/composables/useCart';
  import stripeOrder from '@headlesscommerce/vsf-magento-stripe/stripe/composables/order';

  export default defineComponent({
    name: 'Stripe',
    emits: ['status'],
    setup(_props, { emit }) {
      const { app, $config } = useContext();
      const stripe = ref();
      const paymentElementRef = ref();
      const paymentElement = ref();
      const currency = app.$vsf.$magento.config.state.getCurrency().toLowerCase();
      const { cart } = useCart();
      const { load, save } = usePaymentProvider();
      const paymentMethods = ref(null);
      const elements = ref();
      const { makeOrder } = stripeOrder();

      const initStripe = () => {
        stripe.value = Stripe($config.stripePublishableKey);
      }

      const createPaymentMethod = async () => {
        const paymentMethodResults = await stripe.value.createPaymentMethod({
            elements: elements.value,
            params: {
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
        });

        if (paymentMethodResults.paymentMethod) {
          paymentMethods.value = await save({
            paymentMethod: {
              code: 'stripe_payments',
              stripe_payments: {
                payment_element: true,
                payment_method: paymentMethodResults.paymentMethod.id,
                save_payment_method: true
              }
            }
          });
          return true;
        } else {
          return false;
        }
      };

      const handleError = (error) => {
        console.log(error);
      }

      const isSuccessful = (paymentIntent) => {
        switch (paymentIntent.status) {
          case "succeeded":
            // The payment was captured automatically
            return true;

          case "requires_capture":
            // The authorization succeeded and the payment needs to be captured manually
            return true;

          case "processing":
            // Very rare case where the authorization is still being processed.
            return true;

          case "requires_action":
            // Some required actions are offline, i.e. when placing an order using a voucher like OXXO or Konbini
            if (paymentIntent.next_action && paymentIntent.next_action.type && paymentIntent.next_action.type !== "use_stripe_sdk") {
                // use_stripe_sdk means that handleNextAction should be used. If not, we treat this as an offline required action
                return true;
            }
            break;
        }
        return false;
      };

      const handlePaymentIntent = async (clientSecret) => {
        // Handle payment intent and its status
        try {
          const paymentIntent = await stripe.value.retrievePaymentIntent(clientSecret);
          if (paymentIntent.error) {
            return false;
          } else if (paymentIntent.paymentIntent) {
            // 3D Secure
            if (paymentIntent.paymentIntent.status === "requires_action") {
              const result = await stripe.value.handleNextAction({ clientSecret });
              if (result.paymentIntent) {
                return isSuccessful(result.paymentIntent);
              } else {
                return false;
              }
            } else {
              return isSuccessful(paymentIntent.paymentIntent);
            }
          } else {
            // API call crashed
            return false;
          }
        } catch (error) {
          console.error("An error occurred:", error);
          return false;
        }
      };

      const useStripe = async () => {
        // Process payment using Stripe
        const {error: submitError} = await elements.value.submit();
        if (submitError) {
          handleError(submitError);
          return;
        }
        await createPaymentMethod();
        const response = await makeOrder(cart.value.id);

        const setResponse = async (response) => {
          if (response && response.data && response.data.placeOrder && response.data.placeOrder.order && response.data.placeOrder.order.client_secret) {
            return await handlePaymentIntent(response.data.placeOrder.order.client_secret) ? response.data.placeOrder.order : false;
          }
          return false;
        };
        return await setResponse(response);
      }

      const initPaymentElement = async () => {
        // Initialize payment element
        initStripe();

        const options = {
          mode: 'payment',
          amount: cart.value.prices.grand_total.value * 100,
          currency: currency,
          paymentMethodCreation: 'manual'
        };

        // Set up Stripe.js and Elements to use in checkout form
        elements.value = stripe.value.elements(options);

        // Create and mount the Payment Element
        paymentElement.value = elements.value.create('payment');
        paymentElement.value.mount(paymentElementRef.value);

        // Load payment methods for later access
        paymentMethods.value = await load();
      };

      const validate = () => {
        // Check if all required fields for the selected payment method in the Payment Element have been filled with potentially valid input
        paymentElement.value.on('change', (event) => {
          if (event.complete) {
            emit('status', event.complete);
          }
        });
      }

      onMounted(() => {
        initPaymentElement();
        validate();
      });

      return {
        paymentElementRef,
        useStripe
      }
    }
  });
</script>

