const convertToRp = (value) => {
  const number = value.toString()
  const splittedNumber = []
  for (let i = number.length; i > 0; i = i - 3) {
    if (i < 3) {
      splittedNumber.push(number.substr(0, i))
    } else {
      splittedNumber.push(number.substr(i - 3, 3))
    }
  }
  let separated = ''
  splittedNumber.map(x => {
    if (separated === '') {
      separated = x
    } else {
      separated = x + '.' + separated
    }
  })
  return ('Rp. ' + separated)
}
export default convertToRp;
