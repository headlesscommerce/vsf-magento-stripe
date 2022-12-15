const paymentIntentQuery = `
  mutation createPaymentIntent($input: CreateIntentInput!) {
    createPaymentIntent(input: $input) {
      clientSecret
    }
  }
`;
export default paymentIntentQuery;
