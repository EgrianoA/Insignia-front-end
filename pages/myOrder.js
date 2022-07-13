import { useState, useEffect } from 'react';
import { Row, Col, Modal, Popconfirm, Tabs, Button, Icon } from 'antd';
import { HomeOutlined, DollarCircleOutlined, MinusCircleOutlined, PlusCircleOutlined, DeleteOutlined, ShoppingCartOutlined } from '@ant-design/icons'
import FormLogin from '../components/loginForm';
import axios from 'axios';
import Router from 'next/router';
import openNotification from '../components/_shared/open-notification'
import headers from '../components/_shared/headers';
import convertToRp from '../helpers/convertToRp'
import _ from 'underscore'

const myOrder = () => {
    const { TabPane } = Tabs
    const [keys, setKeys] = useState("1")
    const [cartList, setCartList] = useState([])
    const [detailedCartList, setDetailedCartList] = useState([])
    const [orderList, setOrderList] = useState([])
    const [userLoggedIn, setUserLoggedIn] = useState(false)
    const [loginModalVisible, setLoginModalVisible] = useState(false)

    useEffect(() => {
        checkLoginStatus()
        fetchOrder()
        fetchCart()
    }, [])

    const checkLoginStatus = () => {
        if (localStorage.getItem('token')) {
            setUserLoggedIn(true)
        } else {
            setLoginModalVisible(true)
            // Router.push('/')
        }
    }

    const fetchOrder = () => {
        axios
            .get(process.env.BASE_URL + `/api/orders?filter[customer]=${localStorage.getItem('user_id')}&populate=*`, headers(localStorage.getItem('token')))
            .then(async order => {
                if (order.status === 200 && order.data.data.length > 0) {
                    let orderListArr = []
                    for (let i = 0; i < order.data.data.length; i++) {
                        let orderData = order.data.data[i]
                        let orderDetails = []
                        await axios.get(process.env.BASE_URL + `/api/order-details?filters[order]=${orderData.id}&populate=*`, headers(localStorage.getItem('token'))).then((details) => {
                            if (details.status === 200 && details.data.data.length > 0) {
                                for (let j = 0; j < details.data.data.length; j++) {
                                    let orderDetail = details.data.data[j]
                                    orderDetails.push({
                                        price: orderDetail.attributes.price,
                                        qty: orderDetail.attributes.qty,
                                        package_name: orderDetail.attributes.travel_package.data.attributes.package_title
                                    })
                                }
                            }
                        })
                        orderListArr.push({
                            id: orderData.id,
                            status: orderData.attributes.status,
                            total: orderData.attributes.price,
                            midtrans_id: orderData.attributes.midtrans_orderid,
                            cust_name: orderData.attributes.customer.data.attributes.name,
                            cust_phone: orderData.attributes.customer.data.attributes.phone,
                            cust_email: orderData.attributes.customer.data.attributes.email,
                            details: orderDetails
                        })
                    }
                    setOrderList(orderListArr)
                } else {
                    setOrderList([])
                    console.log(res.data)
                }
            })
            .catch(err => {
                setOrderList([])
                console.log(err)
            });
    }

    const fetchCart = async () => {
        let cartItem = localStorage.getItem('cart-item')
        if (cartItem) {
            cartItem = JSON.parse(cartItem)
            setCartList(cartItem)
            let destinationDetails = await Promise.all(cartItem.map((cart) => {
                return axios.get(process.env.BASE_URL + `/api/travel-packages/${cart.destination_id}?populate=*`).then((res) => {
                    if (res.status === 200) {
                        let destination = res.data.data
                        return {
                            destination_id: cart.destination_id,
                            qty: cart.qty,
                            name: destination.attributes.package_title,
                            price: destination.attributes.price,
                            img: destination.attributes.img.data[0].attributes.formats.medium.url,
                        }
                    } else {
                        return null
                    }
                }).catch((e) => {
                    console.log(e)
                    return null
                })
            }))
            detailedCartList = await _.compact(destinationDetails)
            if (detailedCartList.length > 0) {
                setDetailedCartList(destinationDetails)
                setKeys("2")
            }
        } else {
            setCartList([])
            setDetailedCartList([])
        }
    }


    const addQty = item => {
        let cartIdx = cartList.findIndex(cart => cart.destination_id === item.destination_id)
        if (cartIdx > -1) {
            cartList[cartIdx].qty = item.qty + 1
            detailedCartList[cartIdx].qty = item.qty + 1
            setCartList(cartList)
            setDetailedCartList(detailedCartList)
            localStorage.setItem('cart-item', JSON.stringify(cartList))
        }
        fetchCart()
    }

    const decQty = item => {
        if (item.qty - 1 == 0) {
            deleteFromCart(item)
        } else {
            let cartIdx = cartList.findIndex(cart => cart.destination_id === item.destination_id)
            if (cartIdx > -1) {
                cartList[cartIdx].qty = item.qty - 1
                detailedCartList[cartIdx].qty = item.qty - 1
                setCartList(cartList)
                setDetailedCartList(detailedCartList)
                localStorage.setItem('cart-item', JSON.stringify(cartList))
            }
        }
        fetchCart()
    }

    const deleteFromCart = item => {
        let cartIdx = cartList.findIndex(cart => cart.destination_id === item.destination_id)
        if (cartIdx > -1) {
            cartList.splice(cartIdx, 1)
            detailedCartList.splice(cartIdx, 1)
            if (cartList.length > 0) {
                localStorage.setItem('cart-item', JSON.stringify(newCartList))
                setCartList(cartList)
                setDetailedCartList(detailedCartList)
            } else {
                localStorage.removeItem('cart-item')
                setCartList([])
                setDetailedCartList([])
            }
        }
        fetchCart()
    }

    const changeKey = key => {
        setKeys(key)
    }

    const updatePaymentStatus = async (results, status) => {
        let orderDetail = await axios.get(process.env.BASE_URL + `/api/orders?filters[midtrans_orderid]=${results.order_id}`, headers(localStorage.getItem('token'))).catch(() => { return null })
        if (orderDetail && orderDetail.status === 200) {
            orderDetail = orderDetail.data.data[0]
            if (status === 'success') {
                axios.put(process.env.BASE_URL + `/api/orders/${orderDetail.id}`, { data: { status: "ON PROCESS" } }, headers(localStorage.getItem('token')))
            }
        }
        fetchOrder()
    }

    const checkout = () => {
        setKeys("1")
        axios.get(process.env.BASE_URL + `/api/customers/${localStorage.getItem('user_id')}?populate=*`, headers(localStorage.getItem('token'))).then((res) => {
            if (res.status === 200) {
                let userData = res.data.data.attributes
                const date = new Date()
                const unix = Math.floor(date.getTime() / 1000);
                let totalPrice = 0
                let destinationList = []
                for (let i = 0; i < detailedCartList.length; i++) {
                    totalPrice += detailedCartList[i].qty * detailedCartList[i].price
                    destinationList.push(detailedCartList[i].destination_id)
                }
                let midtransBody = {
                    "transaction_details": {
                        "order_id": `ORDER-${unix}`,
                        "gross_amount": totalPrice
                    },
                    "customer_details": {
                        "first_name": userData.name,
                        "email": userData.email,
                        "phone": userData.phone
                    }
                }
                let orderBody = {
                    data: {
                        price: totalPrice,
                        customer: localStorage.getItem('user_id'),
                        status: 'AWAITING PAYMENT',
                        midtrans_orderid: `ORDER-${unix}`
                    }
                }
                axios.post(process.env.BASE_URL + `/api/orders/midtrans`, midtransBody, headers(localStorage.getItem('token'))).then((res) => {
                    if (res.status === 200) {
                        snap.pay(res.data.token, {
                            onSuccess: (result) => { updatePaymentStatus(result, 'success'); },
                            onPending: (result) => { updatePaymentStatus(result, 'pending'); },
                            onError: (result) => { updatePaymentStatus(result, 'error'); },
                        });
                    }
                })
                axios.post(process.env.BASE_URL + `/api/orders`, orderBody, headers(localStorage.getItem('token'))).then((order) => {
                    if (order.status === 200) {
                        for (let i = 0; i < detailedCartList.length; i++) {
                            let orderDetailsBody = {
                                data: {
                                    order: order.data.data.id,
                                    travel_package: detailedCartList[i].destination_id,
                                    qty: detailedCartList[i].qty,
                                    price: detailedCartList[i].price
                                }
                            }
                            axios.post(process.env.BASE_URL + `/api/order-details`, orderDetailsBody, headers(localStorage.getItem('token')))
                        }
                        fetchOrder()
                        setCartList([])
                        setDetailedCartList([])
                        localStorage.removeItem('cart-item')
                    } else {
                        openNotification('error', 'Gagal Checkout Cart', res.data.message)
                    }
                })
            }
        })
    }

    const triggerMidtrans = (order) => {
        let midtransBody = {
            "transaction_details": {
                "order_id": order.midtrans_id,
                "gross_amount": parseInt(order.total)
            },
            "customer_details": {
                "first_name": order.cust_name,
                "email": order.cust_email,
                "phone": order.cust_phone
            }
        }
        axios.post(process.env.BASE_URL + `/api/orders/midtrans`, midtransBody, headers(localStorage.getItem('token'))).then((res) => {
            if (res.status === 200) {
                snap.pay(res.data.token, {
                    onSuccess: (result) => { updatePaymentStatus(result, 'success'); },
                    onPending: (result) => { updatePaymentStatus(result, 'pending'); },
                    onError: (result) => { updatePaymentStatus(result, 'error'); },
                });
            }
        })
    }

    const orderStatusCard = (orderStatus) => {
        if (orderStatus === 'AWAITING PAYMENT') {
            return { border: '2px solid #05a9f0' }
        }
    }

    const orderStatus = (orderStatus) => {
        if (orderStatus === 'AWAITING PAYMENT') {
            return { color: '#05a9f0' }
        }
        if (orderStatus === 'PAID') {
            return { color: '#05f063' }
        }
    }
    return (
        <div>
            {userLoggedIn && (
                <div className='homePage'>
                    <div className="header">
                        <Row>
                            <Col span={8}>
                                <div className="menu">
                                    <HomeOutlined onClick={() => Router.push('/')} className="homeButton" />
                                </div>
                            </Col>
                            <Col span={8}>
                                <div align="center">
                                    <h1>Insignia Travel</h1>
                                </div>
                            </Col>
                            <Col span={8} />
                        </Row>
                        <hr className='headDivider' />
                    </div>
                    <div className='orderPage'>
                        <center>
                            <h2>{localStorage.getItem('username')}'s Orders List</h2>
                        </center>
                        <Tabs activeKey={keys} onChange={changeKey}>
                            <TabPane tab="Order History" key="1">
                                {orderList.length < 1 && (
                                    <h3>No Order History</h3>
                                )}
                                {orderList.length > 0 && (
                                    <div className="orderList">
                                        <h3>Order History List</h3>
                                        {orderList && orderList.length > 0 && (
                                            orderList.map((order) => {
                                                return (
                                                    <div className='orderHistoryCard' style={orderStatusCard(order.status)} key={order.id}>
                                                        <div className="orderHistoryCardContent" >
                                                            <Row>
                                                                <Col xs={24} md={5} lg={4}>
                                                                    <center>
                                                                        <p style={orderStatus(order.status)}>{order.status}</p>
                                                                        {order.status === 'AWAITING PAYMENT' && (
                                                                            <button className="payButton" onClick={() => triggerMidtrans(order)}><a><DollarCircleOutlined /><span> Pay Now</span></a></button>
                                                                        )}
                                                                    </center>
                                                                </Col>
                                                                <Col xs={24} md={15} lg={16}>
                                                                    <ul type="1">
                                                                        {order.details && order.details.length > 0 && (
                                                                            order.details.map((details, index) => {
                                                                                return (
                                                                                    <li key={index}>{details.package_name + ' (Qty: ' + details.qty + ')'}</li>
                                                                                )
                                                                            }))}
                                                                    </ul>
                                                                </Col>
                                                                <Col xs={24} md={4} lg={4}>
                                                                    <center>
                                                                        <p>Total Price</p>
                                                                        <p>{convertToRp(parseInt(order.total))}</p>
                                                                    </center>
                                                                </Col>
                                                            </Row>
                                                        </div>
                                                    </div>
                                                )
                                            }))}
                                    </div>
                                )
                                }
                            </TabPane>
                            {detailedCartList && detailedCartList.length > 0 && (
                                <TabPane tab="Cart" key="2">
                                    <div className="cartList">
                                        <h3>Cart List</h3>
                                        {detailedCartList.map((cart) => {
                                            return (
                                                <div className='itemsCard'>
                                                    <Row>
                                                        <Col xs={24} md={5} lg={5} xl={4}>
                                                            <img className="cartImg" src={process.env.BASE_URL + cart.img} />
                                                        </Col>
                                                        <Col xs={24} md={11} lg={14} xl={16}>
                                                            <p className="cartProductName">{cart.name}</p>
                                                        </Col>
                                                        <Col xs={24} md={8} lg={5} xl={4}>
                                                            <div className="cartItemPrice">
                                                                <center>
                                                                    <Row>
                                                                        <Col xs={8}>
                                                                            <button onClick={() => decQty(cart)} className="decButton"><a><MinusCircleOutlined /></a></button>
                                                                        </Col>
                                                                        <Col xs={8}>
                                                                            <p>Qty: {cart.qty}</p>
                                                                        </Col>
                                                                        <Col xs={8}>
                                                                            <button onClick={() => addQty(cart)} className="addButton"><a><PlusCircleOutlined /></a></button>
                                                                        </Col>
                                                                    </Row>
                                                                    <Row>
                                                                        <p>{convertToRp(parseInt(cart.price * cart.qty))}</p>
                                                                    </Row>
                                                                    <Row>
                                                                        <Popconfirm
                                                                            placement="leftTop"
                                                                            title="Apakah anda yakin mau hapus item ini?"
                                                                            onConfirm={() => deleteFromCart(cart)}
                                                                            okText="Hapus"
                                                                            cancelText="Batal"
                                                                        >
                                                                            <button className="deleteButton"><a><DeleteOutlined /><span> Delete this item</span></a></button>
                                                                        </Popconfirm>
                                                                    </Row>
                                                                </center>
                                                            </div>
                                                        </Col>
                                                    </Row>
                                                </div>
                                            )
                                        })}
                                        <Row>
                                            <button className="checkoutButton" onClick={checkout}><a><ShoppingCartOutlined /><span> Checkout</span></a></button>
                                        </Row>
                                    </div>
                                </TabPane>
                            )}
                        </Tabs>
                    </div>
                </div>
            )
            }
            {loginModalVisible && (
                <Modal
                    footer={null}
                    visible={loginModalVisible}
                    onCancel={() => {
                        if (userLoggedIn) {
                            setLoginModalVisible(false)
                        }
                    }}
                >
                    <Row type="flex" justify="space-around" align="middle" style={{ marginTop: '10vh' }}>
                        <Col>
                            <FormLogin />
                        </Col>
                    </Row>
                </Modal>
            )}
        </div >
    )
}
export default myOrder;