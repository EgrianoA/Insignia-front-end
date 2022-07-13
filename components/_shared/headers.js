const header = (token) => {
  return {
    headers: {
      Authorization: 'Bearer ' + token
    }
  }
}

export default header
