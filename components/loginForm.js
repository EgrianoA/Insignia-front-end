import { Form, Input, Button } from 'antd';
import { LoginOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import axios from 'axios';
import { useState, useEffect } from 'react';
import openNotification from './_shared/open-notification'
import headers from '../components/_shared/headers';

const LoginForm = props => {
    const [isLogin, setIsLogin] = useState(true)
    const login = values => {
        if (!isLogin) {
            signup(values)
        } else {
            console.log('Login values', values)
            const loginValues = {
                identifier: values.usernameOrEmail,
                password: values.passwordLogin
            }
            axios.post(process.env.BASE_URL + `/api/auth/local?populate=*`, loginValues).then(login => {
                console.log(login.data)
                if (login.status === 200) {
                    axios.get(process.env.BASE_URL + `/api/users/${login.data.user.id}?populate=*`, headers(login.data.jwt)).then((userData) => {
                        if (userData.status === 200) {
                            localStorage.clear()
                            localStorage.setItem('user_id', userData.data.customer.id)
                            localStorage.setItem('username', login.data.user.username)
                            localStorage.setItem('token', login.data.jwt)
                            openNotification('success', 'Welcome', 'Login Successful')
                            setTimeout(() => {
                                window.location.reload()
                            }, 1000)
                        }
                    })
                } else {
                    openNotification('error', 'Username atau password salah', 'Cek kembali username atau password anda')
                }
            })
        }
    }
    const signup = values => {
        console.log('signupvalue:', values)
        let signupValues = {
            username: values.username,
            email: values.email,
            password: values.passwordSignUp
        }
        axios.post(process.env.BASE_URL + `/api/auth/local/register`, signupValues).then(signup => {
            console.log(signup.data)
            if (signup.status === 200) {
                localStorage.clear()
                localStorage.setItem('username', signup.data.user.username)
                localStorage.setItem('token', signup.data.jwt)
                let createCustValues = {
                    data: {
                        name: values.fullname,
                        email: values.email,
                        phone: values.phoneNumber,
                        user: signup.data.user.id
                    }
                }
                axios.post(process.env.BASE_URL + `/api/customers`, createCustValues, headers(signup.data.jwt)).then((createUser) => {
                    if (createUser.status === 200) {
                        openNotification('success', 'Welcome', 'Signup & login Successful')
                        localStorage.setItem('user_id', createUser.data.id)
                        setTimeout(() => {
                            window.location.reload()
                        }, 1000)
                    } else {
                        openNotification('error', res.data.message, 'Cek kembali data yang anda masukan')
                    }

                })
            } else {
                openNotification('error', res.data.message, 'Cek kembali data yang anda masukan')
            }
        })
    }
    return (
        <Form className="login-form" onFinish={login}>
            {isLogin && (
                <div>
                    <h1>Form Login</h1>
                    <Form.Item
                        name='usernameOrEmail'
                        rules={[
                            { required: true, message: 'Please input your Username or Email!' }
                        ]} >
                        <Input placeholder="Username or Email" />
                    </Form.Item>
                    <Form.Item
                        name='passwordLogin'
                        rules={[{ required: true, message: 'Please input your Password!' }]}>
                        <Input.Password
                            prefix={<LockOutlined style={{ color: 'rgba(0,0,0,.75)' }} />}
                            type="password"
                            placeholder="Password"
                        />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" block htmlType="submit">
                            <LoginOutlined /> Login
                        </Button>
                        <Button type="default" block onClick={() => setIsLogin(false)}>
                            <span>I'm new, I doesn't have account</span>
                        </Button>
                    </Form.Item>
                </div>
            )}
            {!isLogin && (
                <div>
                    <h1>Form Signup</h1>
                    <Form.Item
                        name='username'
                        rules={[
                            { required: true, message: 'Please input your Username!' }
                        ]}>
                        <Input placeholder="Username" />
                    </Form.Item>
                    <Form.Item
                        name='fullname'
                        rules={[
                            { required: true, message: 'Please input your Name!' }
                        ]}>
                        <Input placeholder="Full Name" />
                    </Form.Item>
                    <Form.Item
                        name='email'
                        rules={[
                            { type: 'email', message: 'The input is not valid email!' },
                            { required: true, message: 'Please input your email!' }
                        ]}>
                        <Input prefix={<MailOutlined style={{ color: 'rgba(0,0,0,.75)' }} />} placeholder="email" />
                    </Form.Item>
                    <Form.Item
                        name='phoneNumber'
                        rules={[{ required: true, message: 'Please input your Phone Number!' }]}>
                        <Input addonBefore="+62" placeholder="" />
                    </Form.Item>
                    <Form.Item
                        name='passwordSignUp'
                        rules={[{ required: true, message: 'Please input your Password!' }]}>
                        <Input.Password
                            prefix={<LockOutlined style={{ color: 'rgba(0,0,0,.75)' }} />}
                            type="password"
                            placeholder="Password"
                        />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" block htmlType="submit">
                            <span><LoginOutlined /> Signup</span>
                        </Button>
                        <Button type="default" block onClick={() => setIsLogin(true)}>
                            I already have account
                        </Button>
                    </Form.Item>
                </div>
            )}
        </Form>
    )

}
export default LoginForm