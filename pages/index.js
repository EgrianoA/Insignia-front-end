import { useState, useEffect } from 'react';
import { Row, Col, Spin, Card, Modal, Button } from 'antd';
import { ShoppingCartOutlined, LoginOutlined, LogoutOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons'
import axios from 'axios';
import openNotification from '../components/_shared/open-notification';
import headers from '../components/_shared/headers';
import Router from 'next/router';
import FormLogin from '../components/loginForm';
import convertToRp from '../helpers/convertToRp';
import InfiniteScroll from 'react-infinite-scroll-component';

const Home = () => {
  const [page, setPage] = useState(1)
  const [dataLength, setDataLength] = useState(5)
  const [hasMore, setHasMore] = useState(true)
  const [loginModalVisible, setLoginModalVisible] = useState(false)
  const [userLoggedIn, setUserLoggedIn] = useState(false)
  const [visible, setVisible] = useState(false)
  const [destinationDetail, setDestinationDetail] = useState()
  const [destinationList, setDestinationList] = useState([])
  const [cartList, setCartList] = useState([])

  const pageSize = 5
  useEffect(() => {
    checkLoginStatus()
    fetchDestination()
    checkCart()
  }, []);

  const checkLoginStatus = () => {
    if (localStorage.getItem('token')) {
      setUserLoggedIn(true)
    }
  }

  const login = () => {
    setLoginModalVisible(!loginModalVisible)
  }

  const logout = () => {
    openNotification('success', 'Anda berhasil logout', 'Sampai Jumpa!')
    localStorage.clear();
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

  const fetchDestination = () => {
    axios.get(process.env.BASE_URL + `/api/travel-packages?pagination[page]=${page}&pagination[pageSize]=${pageSize}&populate=*`).then((res) => {
      if (res.status === 200) {
        setDestinationList(res.data.data)
      } else {
        console.log(res.data)
      }
    }).catch(err => {
      console.log(err)
    });
  }

  const nextPage = () => {
    let newPage = page + 1
    axios.get(process.env.BASE_URL + `/api/travel-packages?pagination[page]=${newPage}&pagination[pageSize]=${pageSize}&populate=*`).then((res) => {
      if (res.status === 200) {
        setDestinationList(destinationList.concat(res.data.data))
        setPage(newPage)
        setDataLength(dataLength + 5)
        if (dataLength + 5 >= res.data.meta.pagination.total) {
          setHasMore(false)
        }
      } else {
        console.log(res.data)
      }
    }).catch(err => {
      console.log(err)
    });
  }

  const openModal = item => {
    setVisible(true)
    setDestinationDetail(item)
  }

  const checkCart = () => {
    let cartItem = localStorage.getItem('cart-item')
    if (cartItem) {
      setCartList(JSON.parse(cartItem))
    }
  }

  const addToCart = async (destination) => {
    console.log(destination)
    let cartItem = localStorage.getItem('cart-item')
    if (!cartItem) {
      cartItem = []
    } else {
      cartItem = JSON.parse(cartItem)
    }
    let destinationIdx = await cartItem.findIndex(cart => cart.destination_id === destination.id)
    if (destinationIdx > -1) {
      cartItem.splice(destinationIdx, 1)
    } else {
      cartItem.push({
        destination_id: destination.id,
        qty: 1
      })
    }
    console.log(cartItem)
    if (cartItem.length > 0) {
      localStorage.setItem('cart-item', JSON.stringify(cartItem))
    } else {
      localStorage.removeItem('cart-item')
    }
    setCartList(cartItem)
  }

  return (
    <div className="homePage">
      <div className="header">
        <Row>
          <Col xs={0} sm={8} />
          <Col xs={12} sm={8}>
            <div align="center">
              <h1>Insignia Travel</h1>
            </div>
          </Col>
          <Col xs={12} sm={8}>
            <div className="rightIcons">
              {userLoggedIn && (
                <div>
                  <ShoppingCartOutlined onClick={() => Router.push('/myOrder')} className="shoppingCartButton" />
                  <LogoutOutlined onClick={logout} className="logoutButton" />
                </div>
              )}
              {!userLoggedIn && (
                <LoginOutlined onClick={login} className="loginButton" />
              )}
            </div>
          </Col>
        </Row>
        <hr className='headDivider' />
      </div>
      <Modal
        footer={null}
        visible={loginModalVisible}
        onCancel={() => setLoginModalVisible(false)}
      >
        <Row type="flex" justify="space-around" align="middle" style={{ marginTop: '10vh' }}>
          <Col>
            <FormLogin />
          </Col>
        </Row>
      </Modal>
      <Row>
        <div className='page'>
          {userLoggedIn && (
            <p className='userName'>Hi, {localStorage.getItem('username')}</p>
          )}
          <Row gutter={16} className='container'>
            <InfiniteScroll
              dataLength={dataLength}
              next={nextPage}
              hasMore={hasMore}
              loader={<center><Spin /></center>}
              style={{ overflow: 'hidden' }}>
              {destinationList && destinationList.length > 1 && (
                destinationList.map((destination) => {
                  return (
                    <center>
                      {visible && (
                        <Modal
                          className="modal"
                          footer={null}
                          visible={visible}
                          onCancel={() => setVisible(false)}
                        >
                          {destinationDetail && (
                            <div className="destinationDetail">
                              <Col xs={24} lg={12} className="leftSection">
                                <center>
                                  <img src={process.env.BASE_URL + destinationDetail.attributes.img.data[0].attributes.formats.medium.url} />
                                </center>
                              </Col>
                              <Col xs={24} lg={12} className="rightSection">
                                <h3>{destinationDetail.attributes.package_title}</h3>
                                <h4>{convertToRp(parseInt(destinationDetail.attributes.price))}</h4>
                                <p>{destinationDetail.attributes.description}</p>
                                <center>
                                  {cartList && cartList.find((cart) => cart.destination_id === destination.id) ?
                                    <button className="removeFromCart" onClick={() => addToCart(destinationDetail)}><a><span> Remove From Cart</span><ShoppingCartOutlined /></a></button> :
                                    <button className="addToCartButton" onClick={() => addToCart(destinationDetail)}><a><span> Add To Cart</span><ShoppingCartOutlined /></a></button>}
                                </center>
                              </Col>
                            </div>
                          )}
                        </Modal>
                      )}
                      <Col xs={12} lg={8} xl={6} className='item' style={{ marginBottom: '20px' }} key={destination.id}>
                        <Card className='itemCard'>
                          <a><Row onClick={() => openModal(destination)}>
                            <Row>
                              <img src={process.env.BASE_URL + destination.attributes.img.data[0].attributes.formats.small.url} className='itemImage' />
                            </Row>
                            <br />
                            <div style={{ textAlign: 'left' }}>
                              <h3>{destination.attributes.package_title}</h3>
                              <p>{convertToRp(parseInt(destination.attributes.price))}</p>
                              <br />
                            </div>
                          </Row>
                          </a>
                          <Row className="cardFooter">
                            {userLoggedIn && (
                              <a>
                                <div className="cart">
                                  {cartList && cartList.find((cart) => cart.destination_id === destination.id) ?
                                    <Button type="danger" onClick={() => addToCart(destination)}><MinusOutlined /><ShoppingCartOutlined /></Button> :
                                    <Button onClick={() => addToCart(destination)}><PlusOutlined /><ShoppingCartOutlined /></Button>}
                                </div>
                              </a>
                            )}
                          </Row>
                        </Card>
                      </Col>
                    </center>
                  )
                })
              )}
            </InfiniteScroll>
          </Row>
        </div>
      </Row>
    </div >
  );
}

export default Home
