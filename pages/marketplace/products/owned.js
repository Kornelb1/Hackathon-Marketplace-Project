

import { useAccount, useOwnedProducts } from "@components/hooks/web3"
import { Button, Message } from "@components/ui/common"
import { OwnedProductCard } from "@components/ui/product"
import { BaseLayout } from "@components/ui/layout"
import { MarketHeader } from "@components/ui/marketplace"
import { getAllProducts } from "@content/products/fetcher"
import { useRouter } from "next/router"
import Link from "next/link"
import { useWeb3 } from "@components/providers"

export default function OwnedProducts({products}) {
  const router = useRouter()
  const { requireInstall } = useWeb3()
  const { account } = useAccount()
  const { ownedProducts } = useOwnedProducts(products, account.data)

  return (
    <>
      <MarketHeader />
      <section className="grid grid-cols-1">
        { ownedProducts.isEmpty &&
          <div className="w-1/2">
            <Message type="warning">
              <div>You don&apos;t own any products</div>
              <Link href="/marketplace">
                <a className="font-normal hover:underline">
                  <i>Purchase Product</i>
                </a>
              </Link>
            </Message>
          </div>
        }
        { account.isEmpty &&
          <div className="w-1/2">
            <Message type="warning">
              <div>Please connect to Metamask</div>
            </Message>
          </div>
        }
        { requireInstall &&
          <div className="w-1/2">
            <Message type="warning">
              <div>Please install Metamask</div>
            </Message>
          </div>
        }
        { ownedProducts.data?.map(product =>
          <OwnedProductCard
            key={product.id}
            product={product}
          >
            <Button
              onClick={() => router.push(`/products/${product.slug}`)}
            >
              See Product
            </Button>
          </OwnedProductCard>
        )}
      </section>
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

OwnedProducts.Layout = BaseLayout
