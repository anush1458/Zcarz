import React, { useEffect, useState, useCallback, useReducer, useRef } from 'react'
import { useParams } from 'react-router-dom';
import gsap from 'gsap';
import axios from '../../axios';

import PreLoader from '../../shared/components/PreLoader/PreLoader';
import OrdersList from '../components/OrdersList';
import Layout from '../../shared/components/Layout/Layout';

const orderReducer = ( state, action ) => {
    switch(action.type){
        case 'GET':
            return action.orders;
        case 'DELETE':
            return state.filter(order => order.id !== action.id);
        case 'UPDATE_ORDER':
                return state.map(order => {
                    if(order.id === action.id){ 
                    return {
                        ...order,
                        ...action.update
                    }               
                }
                return order
        });
        default:
            return state;
    }
};


const Orders = () => {

    const [ orders, dispatch ] = useReducer(orderReducer, [])
    const [ isLoading, setIsLoading ] = useState(false);
    const uid = useParams().id;
    let tl = useRef();
    let title = useRef(null);
    let line = useRef(null);

    useEffect(() => {
        tl.current = gsap.timeline();
        tl.current.from(title, 1.5,{scale: 0.5, opacity:0})
                  .from(line, 2, { width: 0 }, 0.5)
    }, []);

    useEffect(() => {
        setIsLoading(true);
        axios.get(`/orders/user/${uid}`)
             .then(res => {
                setIsLoading(false);
                dispatch({type: 'GET', orders: res.data.orders})
             }).catch(err => {
                setIsLoading(false);
                console.log(err)
             })
    }, [uid]);

    const loadScript = (src) => {
        return new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = src;
          script.onload = () => {
            resolve(true);
          };
          script.onerror = () => {
            resolve(false);
          };
          document.body.appendChild(script);
        });
      };
    
      useEffect(() => {
        loadScript("https://checkout.razorpay.com/v1/checkout.js");
      });

    const onDeleteOrder = useCallback((orderId) => {
        setIsLoading(true);
        axios.delete(`/orders/${orderId}`)
             .then(res => {
                setIsLoading(false);
                dispatch({type: 'DELETE', id: orderId})
             }).catch(err => {
                setIsLoading(false);
                console.log(err)
             })
    }, []);

    const onPayNowHandler = useCallback((orderId) => {
        setIsLoading(true);
        axios.patch(`/orders/option/${orderId}`, {isPayNow : true},
                { 'Content-Type': 'application/json' })
             .then(res => {
                setIsLoading(false);
                dispatch({type:'UPDATE_ORDER', id: orderId, update: res.data.order})
             }).catch(err => {
                setIsLoading(false);
                console.log(err)
             });
    }, []);

    const onPayLaterHandler = useCallback((orderId) => {
        setIsLoading(true);
        axios.patch(`/orders/option/${orderId}`, {isPayNow : false},
                { 'Content-Type': 'application/json' })
             .then(res => {
                setIsLoading(false);
                dispatch({type:'UPDATE_ORDER', id: orderId, update: res.data.order})
             }).catch(err => {
                setIsLoading(false);
                console.log(err)
             });
    }, []);

    //Send e-mail on confirm order
    const sendInvoiceEmail = useCallback((orderId) => {
        axios.post(`/emails/send/${uid}`, {orderId},
       { 'Content-Type': 'application/json' })
             .then(res => {
             }).catch(err => {
                console.log(err)
             });
    }, [uid]);

    const onInvoicePdf = useCallback((orderId) => {
        setIsLoading(true);
        axios.get(`/orders/invoice/${orderId}`)
             .then(res=> {
                setIsLoading(false);
             }).catch(err => {
                setIsLoading(false);
                console.log(err)
             });
    }, [])

const razorPayHandler = useCallback(async (orderId) => {
    const data = await fetch(`https://zcars.herokuapp.com/api/emails/razorpay/${orderId}`, {
        method: "POST",
      }).then((t) => t.json());
    
      console.log(data);
    const options = {
        key: process.env.RAZORPAY_KEY_ID || 'rzp_test_4qPTM5GMllbbGk',
        currency: data.currency,
        amount: data.amount,
        name: "Learn Code Online",
        description: "Wallet Transaction",
        order_id: data.id,
        handler: function (response) {
          alert("Payment got Successfull , your payment id : " + response.razorpay_payment_id);
          window.location.href = "http://localhost:3000/";
        },
        prefill: {
          name: "Anush",
          email: "anush@gmail.com",
          contact: "9999999999",
        },
      };
    
      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

},[]);
 
    return(
      <Layout> 
           <h1 ref={ el => ( title = el )} className='home-title'>
                Your order and Checkout page</h1>
            <p ref={ el => ( line = el )} className='line'/>
            {
                isLoading 
                ? <PreLoader /> 
                : <OrdersList orders={orders}
                onDeleteOrder={onDeleteOrder}
                onPayNowHandler={onPayNowHandler}
                onPayLaterHandler={onPayLaterHandler}
                sendInvoiceEmail={sendInvoiceEmail}
                onInvoicePdf={onInvoicePdf}
                razorPayHandler={razorPayHandler}
                />
            }        
      </Layout>
    )
}

export default Orders;