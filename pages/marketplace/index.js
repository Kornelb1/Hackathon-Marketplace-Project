

import { ProductCard, ProductList } from "@components/ui/product"
import { BaseLayout } from "@components/ui/layout"
import { getAllProducts } from "@content/products/fetcher"
import { useOwnedProducts, useWalletInfo } from "@components/hooks/web3"
import { Button, Loader, Message } from "@components/ui/common"
import { OrderModal } from "@components/ui/order"
import { useState } from "react"
import { MarketHeader } from "@components/ui/marketplace"
import { useWeb3 } from "@components/providers"
import { withToast } from "@utils/toast"

export default function Marketplace({products}) {
  const { web3, contract, requireInstall } = useWeb3()
  const { hasConnectedWallet, isConnecting, account } = useWalletInfo()
  const { ownedProducts } = useOwnedProducts(products, account.data)

  const [selectedProduct, setSelectedProduct] = useState(null)
  const [busyProductId, setBusyProductId] = useState(null)
  const [isNewPurchase, setIsNewPurchase] = useState(true)

  const purchaseProduct = async (order, product) => {
    const hexProductId = web3.utils.utf8ToHex(product.id)
    const orderHash = web3.utils.soliditySha3(
      { type: "bytes16", value: hexProductId },
      { type: "address", value: account.data }
    )

    const value = web3.utils.toWei(String(order.price))

    setBusyProductId(product.id)
    if (isNewPurchase) {
      const emailHash = web3.utils.sha3(order.email)
      const proof = web3.utils.soliditySha3(
        { type: "bytes32", value: emailHash },
        { type: "bytes32", value: orderHash }
      )

      withToast(_purchaseProduct({hexProductId, proof, value}, product))
    } else {
      withToast(_repurchaseProduct({productHash: orderHash, value}, product))
    }
  }

  const _purchaseProduct = async ({hexProductId, proof, value}, product) => {
    try {
      const result = await contract.methods.purchaseProduct(
        hexProductId,
        proof
      ).send({from: account.data, value})

      ownedProducts.mutate([
        ...ownedProducts.data, {
          ...product,
          proof,
          state: "purchased",
          owner: account.data,
          price: value
        }
      ])
      return result
    } catch(error) {
      throw new Error(error.message)
    } finally {
      setBusyProductId(null)
    }
  }

  const _repurchaseProduct = async ({productHash, value}, product) => {
    try {
      const result = await contract.methods.repurchaseProduct(
        productHash
      ).send({from: account.data, value})

      const index = ownedProducts.data.findIndex(c => c.id === product.id)

      if (index >= 0) {
        ownedProducts.data[index].state = "purchased"
        ownedProducts.mutate(ownedProducts.data)
      } else {
        ownedProducts.mutate()

      }
      return result
    } catch(error) {
      throw new Error(error.message)
    } finally {
      setBusyProductId(null)
    }
  }

  const cleanupModal = () => {
    setSelectedProduct(null)
    setIsNewPurchase(true)
  }

  return (
    <>
      <MarketHeader />
      <ProductList
        products={products}
      >
      {product => {
        const owned = ownedProducts.lookup[product.id]
        return (
          <ProductCard
            key={product.id}
            product={product}
            state={owned?.state}
            disabled={!hasConnectedWallet}
            Footer={() => {
              if (requireInstall) {
                return (
                  <Button
                    size="sm"
                    disabled={true}
                    variant="lightRed">
                    Proceed
                  </Button>
                )
              }

              if (isConnecting) {
                return (
                  <Button
                    size="sm"
                    disabled={true}
                    variant="lightRed">
                    <Loader size="sm" />
                  </Button>
                )
              }

              if (!ownedProducts.hasInitialResponse) {
                return (
                  // <div style={{height: "42px"}}></div>
                  <Button
                    variant="white"
                    disabled={true}
                    size="sm">
                    { hasConnectedWallet ?
                      "Loading State..." :
                      "Connect"
                    }
                  </Button>
                )
              }

              const isBusy = busyProductId === product.id
              if (owned) {
                return (
                  <>
                    <div className="flex">
                      <Button
                        onClick={() => alert("You are owner of this product.")}
                        disabled={false}
                        size="sm"
                        variant="white">
                        Yours &#10004;
                      </Button>
                      { owned.state === "deactivated" &&
                        <div className="ml-1">
                          <Button
                            size="sm"
                            disabled={isBusy}
                            onClick={() => {
                              setIsNewPurchase(false)
                              setSelectedProduct(product)
                            }}
                            variant="red">
                            { isBusy ?
                              <div className="flex">
                                <Loader size="sm" />
                                <div className="ml-2">In Progress</div>
                              </div> :
                              <div>Fund to Activate</div>
                            }
                          </Button>
                        </div>
                      }
                    </div>
                  </>
                )
              }


              return (
                <Button
                  onClick={() => setSelectedProduct(product)}
                  size="sm"
                  disabled={!hasConnectedWallet || isBusy}
                  variant="lightRed">
                  { isBusy ?
                   <div className="flex">
                      <Loader size="sm" />
                      <div className="ml-2">In Progress</div>
                   </div> :
                  <div>Purchase</div>
                  }
                </Button>
              )}
            }
          />
        )}
      }
      </ProductList>
      { selectedProduct &&
        <OrderModal
          product={selectedProduct}
          isNewPurchase={isNewPurchase}
          onSubmit={(formData, product) => {
            purchaseProduct(formData, product)
            cleanupModal()
          }}
          onClose={cleanupModal}
        />
      }
    </>
  )
}

export function getStaticProps() {
  const { data } = getAllProducts()
  return {
    props: {
      products: data
    }
  }
}

Marketplace.Layout = BaseLayout
