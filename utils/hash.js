


export const createProductHash = web3 => (productId, account) => {
  const hexProductId = web3.utils.utf8ToHex(productId)
  const productHash = web3.utils.soliditySha3(
    { type: "bytes16", value: hexProductId },
    { type: "address", value: account }
  )

  return productHash
}
