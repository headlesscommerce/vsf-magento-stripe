import { useApi } from '~/composables/useApi';
import paymentIntentQuery from './paymentIntentQuery';
import { Logger } from '~/helpers/logger';

export const usePaymentIntent = () => {
  const { mutate } = useApi();

  const clientSecret = async (cartId: String) => {
    Logger.debug('usePaymentIntent.clientSecret');
    let result = null;

    try {
      result = mutate(paymentIntentQuery, { input: { cart_id: cartId }})
      .then((response) => {
        if (response != null) {
          return response.data['createPaymentIntent'].clientSecret;
        } else {
          Logger.error('usePaymentIntent/clientSecret', 'response is null');
        }
      })
    } catch(error) {
      Logger.error('usePaymentIntent/clientSecret', error.message);
    };

    Logger.debug('[Result/usePaymentIntent.clientSecret]:', { result });
    return result;
  }

  return {
    clientSecret
  };
};

export default usePaymentIntent;
