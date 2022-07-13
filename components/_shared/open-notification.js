import { notification } from 'antd'

const openNotification = (type, message, description) => {
  if (type === 'error') {
    notification.error({ message: message, description: description })
  }
  if (type === 'success') {
    notification.success({ message: message, description: description })
  }
  if (type === 'info') {
    notification.info({ message: message, description: description })
  }
}

export default openNotification
