# Stripe Payment Module for Vue Storefront 2

Stripe Payments integration for [Vue Storefront with Magento 2](https://github.com/vuestorefront/magento2). Supports 3D Secure.

## Requirements for Magento 2
On Magento's side its required to extend the official [Stripe Magento 2 module](https://marketplace.magento.com/stripe-stripe-payments.html) with some additional GraphQL features. 

## Integration to theme
Install the package `npm -i @headlesscommerce/vsf-magento-stripe` or `yarn add @headlesscommerce/vsf-magento-stripe`.

### Add Stripe Key 
Add the Stripe publishable key to `nuxt.config.js` in `publicRuntimeConfig`.

```
publicRuntimeConfig: {
  stripePublishableKey: process.env.NODE_ENV === 'production' ? 'pk_live' : 'pk_test',
}
```

###  Include Stripe.js
In `modules/checkout/pages/Checkout.vue`([file](https://github.com/vuestorefront/template-magento/blob/main/modules/checkout/pages/Checkout.vue)) include the [stripe.js](https://stripe.com/docs/js) script in `head`.

```
head() {
  return {
    script: [
      {
        src: 'https://js.stripe.com/v3'
      }
    ],
  }
}
```

### Update processOrder in Checkout/Payment
In `modules/checkout/pages/Checkout/Payment.vue`([file](https://github.com/vuestorefront/template-magento/blob/main/modules/checkout/pages/Checkout/Payment.vue)) add a `ref` to the _VsfPaymentProvider_ component e.g:
 `<VsfPaymentProvider  ref="VsfPaymentProviderRef" @status="isPaymentReady = true" />`
 
Then access the `triggerStripe` from the `VsfPaymentProvider` component and overide the `processOrder` function by removing the `order.value = await make();` with `const stripeStatus = await VsfPaymentProviderRef.value.triggerStripe();` and `order.value.order.order_number` with `stripeStatus.order_number`.

```
  const processOrder = async () => {
  const stripeStatus = await VsfPaymentProviderRef.value.triggerStripe();
  if (!stripeStatus) {
    return;
  }
  setCart(null);
  app.$vsf.$magento.config.state.removeCartId();
  await load();
  await removeItem('checkout');
  const thankYouRoute = app.localeRoute({
    name: 'thank-you',
    query: {
      order: stripeStatus.order_number,
    },
  });
  await router.push(thankYouRoute);
};
```
### Add Stripe component to VsfPaymentProvider
In `modules/checkout/components/VsfPaymentProvider.vue` ([file](https://github.com/vuestorefront/template-magento/blob/main/modules/checkout/components/VsfPaymentProvider.vue)) import the Stripe component and override the _details_ slot of `SfRadio` component to add the Stripe component. 

Example:
```
<template>
    <SfRadio v-for="method in paymentMethods">
       <template #details>
         <Stripe ref="StripeRef" v-if="method.code === 'stripe_payments'" @status="paymentStatus" />
       </template>
    </SfRadio>
 </template>
 <script lang="ts">
    import { Stripe } from '@headlesscommerce/vsf-magento-stripe';
    export default defineComponent({
      name: 'VsfPaymentProvider',
        components: {
        ...
        Stripe
      },
    });
 </script>
```


### Set useStripe composable
In `modules/checkout/components/VsfPaymentProvider.vue` ([file](https://github.com/vuestorefront/template-magento/blob/main/modules/checkout/components/VsfPaymentProvider.vue)) set a `ref` for the Stripe component then to validate and initiate the Stripe `useStripe` composable.

```
export default defineComponent({
  name: 'VsfPaymentProvider',
  ...
  setup(_props, { emit }) {
    const StripeRef = ref(null);
    const definePaymentMethods = async (paymentMethodCode: string) => {
      if (paymentMethodCode !== 'stripe_payments') {
        // Avoid emitting just yet, see paymentStatus function
        emit('status', paymentMethodCode);
      }
    };
    // Validate and initiate stripe
    const triggerStripe = async () => {
      if (selectedPaymentMethodCode.value == 'stripe_payments') {
        return await StripeRef.value[0].useStripe();
      } else {
        return;
      }
    }
    const paymentStatus = () => {
      emit('status', 'true');
    };
    return {
      ...
      paymentStatus,
      triggerStripe,
      StripeRef
    };
  },
});
```

