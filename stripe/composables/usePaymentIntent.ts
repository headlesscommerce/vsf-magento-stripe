import { useApi } from '~/composables/useApi';
import paymentIntentQuery from './paymentIntentQuery';
import { Logger } from '~/helpers/logger';

export const usePaymentIntent = () => {
  const { mutate } = useApi();

  const getClientSecret = async (cartId: string) => {
    Logger.debug('usePaymentIntent.clientSecret');
    let result: string = '';

    const createPaymentIntentResponse = await mutate(paymentIntentQuery, { input: { cart_id: cartId }});
    result = createPaymentIntentResponse?.data['createPaymentIntent']?.clientSecret;

    Logger.debug('[Result/usePaymentIntent.clientSecret]:', { result });
    return result;
  }

  return {
    getClientSecret
  };
};

export default usePaymentIntent;
