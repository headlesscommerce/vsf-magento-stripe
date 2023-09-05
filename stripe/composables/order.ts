import { useApi } from '~/composables/useApi';

export const stripeOrder = () => {
  const { mutate } = useApi();

  const makeOrder =  async (cart: string) => {
    const query = `
      mutation {
        placeOrder(input: {cart_id: "${cart}"}) {
          order {
            order_number
            client_secret
          }
        }
      }
    `;
    return await mutate(query);
  }

  return {
    makeOrder
  };
};

export default stripeOrder;
