

export const PRODUCT_STATES = {
  0: "purchased",
  1: "activated",
  2: "deactivated",
}


export const normalizeOwnedProduct = web3 => (product, ownedProduct) => {
  return {
    ...product,
    ownedProductId: ownedProduct.id,
    proof: ownedProduct.proof,
    owned: ownedProduct.owner,
    price: web3.utils.fromWei(ownedProduct.price),
    state: PRODUCT_STATES[ownedProduct.state]
  }
}
