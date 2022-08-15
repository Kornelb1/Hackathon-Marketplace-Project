

import { useAdmin, useManagedProducts } from "@components/hooks/web3";
import { useWeb3 } from "@components/providers";
import { Button, Message } from "@components/ui/common";
import { ProductFilter, ManagedProductCard } from "@components/ui/product";
import { BaseLayout } from "@components/ui/layout";
import { MarketHeader } from "@components/ui/marketplace";
import { normalizeOwnedProduct } from "@utils/normalize";
import { withToast } from "@utils/toast";
import { useEffect, useState } from "react";

const VerificationInput = ({onVerify}) => {
  const [ email, setEmail ] = useState("")

  return (
    <div className="flex mr-2 relative rounded-md">
      <input
        value={email}
        onChange={({target: {value}}) => setEmail(value)}
        type="text"
        name="account"
        id="account"
        className="w-96 focus:ring-red-500 shadow-md focus:border-red-500 block pl-7 p-4 sm:text-sm border-gray-300 rounded-md"
        placeholder="0x2341ab..." />
      <Button
        onClick={() => {
          onVerify(email)
        }}
      >
        Verify
      </Button>
    </div>
  )
}

export default function ManagedProducts() {
  const [ proofedOwnership, setProofedOwnership ] = useState({})
  const [ searchedProduct, setSearchedProduct ] = useState(null)
  const [ filters, setFilters ] = useState({state: "all"})
  const { web3, contract } = useWeb3()
  const { account } = useAdmin({redirectTo: "/marketplace"})
  const { managedProducts } = useManagedProducts(account)

  const verifyProduct = (email, {hash, proof}) => {
    if (!email) {
      return
    }

    const emailHash = web3.utils.sha3(email)
    const proofToCheck = web3.utils.soliditySha3(
      { type: "bytes32", value: emailHash },
      { type: "bytes32", value: hash }
    )

    proofToCheck === proof ?
      setProofedOwnership({
        ...proofedOwnership,
        [hash]: true
      }) :
      setProofedOwnership({
        ...proofedOwnership,
        [hash]: false
      })
  }

  const changeProductState = async (productHash, method) => {
    try {
      const result = await contract.methods[method](productHash)
        .send({
          from: account.data
        })

      return result
    } catch(e) {
      throw new Error(e.message)
    }
  }

  const activateProduct = async productHash => {
    withToast(changeProductState(productHash, "activateProduct"))
  }

  const deactivateProduct = async productHash => {
    withToast(changeProductState(productHash, "deactivateProduct"))
  }

  const searchProduct = async hash => {
    const re = /[0-9A-Fa-f]{6}/g;

    if(hash && hash.length === 66 && re.test(hash)) {
      const product = await contract.methods.getProductByHash(hash).call()

      if (product.owner !== "0x0000000000000000000000000000000000000000") {
        const normalized = normalizeOwnedProduct(web3)({hash}, product)
        setSearchedProduct(normalized)
        return
      }
    }

    setSearchedProduct(null)
  }

  const renderCard = (product, isSearched) => {
    return (
      <ManagedProductCard
        key={product.ownedProductId}
        isSearched={isSearched}
        product={product}
      >
        <VerificationInput
          onVerify={email => {
            verifyProduct(email, {
              hash: product.hash,
              proof: product.proof
            })
          }}
        />
        { proofedOwnership[product.hash] &&
          <div className="mt-2">
            <Message>
              Verified!
            </Message>
          </div>
        }
        { proofedOwnership[product.hash] === false &&
          <div className="mt-2">
            <Message type="danger">
              Wrong Proof!
            </Message>
          </div>
        }
        { product.state === "purchased" &&
          <div className="mt-2">
            <Button
              onClick={() => activateProduct(product.hash)}
              variant="green">
              Activate
            </Button>
            <Button
              onClick={() => deactivateProduct(product.hash)}
              variant="red">
              Deactivate
            </Button>
          </div>
        }
      </ManagedProductCard>
    )
  }

  if (!account.isAdmin) {
    return null
  }

  const filteredProducts = managedProducts.data
    ?.filter((product) => {
      if (filters.state === "all") {
        return true
      }

      return product.state === filters.state
    })
    .map(product => renderCard(product) )

  return (
    <>
      <MarketHeader />
      <ProductFilter
        onFilterSelect={(value) => setFilters({state: value})}
        onSearchSubmit={searchProduct}
      />
      <section className="grid grid-cols-1">
        { searchedProduct &&
          <div>
            <h1 className="text-2xl font-bold p-5">Search</h1>
            { renderCard(searchedProduct, true) }
          </div>
        }
        <h1 className="text-2xl font-bold p-5">All Products</h1>
        { filteredProducts }
        { filteredProducts?.length === 0 &&
          <Message type="warning">
            No products to display
          </Message>
        }
      </section>
    </>
  )
}

ManagedProducts.Layout = BaseLayout
