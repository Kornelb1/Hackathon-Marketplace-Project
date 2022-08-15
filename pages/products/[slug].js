import { useAccount, useOwnedProduct } from "@components/hooks/web3";
import { useWeb3 } from "@components/providers";
import { Message, Modal } from "@components/ui/common";
import {
  ProductHero,
  Curriculum,
  Keypoints
} from "@components/ui/product";
import { BaseLayout } from "@components/ui/layout";
import { getAllProducts } from "@content/products/fetcher";

export default function Product({product}) {
  const { isLoading } = useWeb3()
  const { account } = useAccount()
  const { ownedProduct } = useOwnedProduct(product, account.data)
  const productState = ownedProduct.data?.state
  // const productState = "deactivated"

  const isLocked =
    !productState ||
    productState === "purchased" ||
    productState === "deactivated"

  return (
    <>
      <div className="py-4">
        <ProductHero
          hasOwner={!!ownedProduct.data}
          title={product.title}
          description={product.description}
          image={product.coverImage}
          image_hover={product.hoverImage}
        />
      </div>
      <Keypoints
        points={product.wsl}
      />
      { productState &&
        <div className="max-w-5xl mx-auto">
          { productState === "purchased" &&
            <Message type="warning">
              Product is purchased and waiting for the activation. Process can take up to 24 hours.
              <i className="block font-normal">In case of any questions, please contact hackathonmarketplace@gmail.com</i>
            </Message>
          }
          { productState === "activated" &&
            <Message type="success">
              The marketplace wishes you happy using of the product.
            </Message>
          }
          { productState === "deactivated" &&
            <Message type="danger">
              Product has been deactivated, due the incorrect purchase data.
              The functionality to watch the product has been temporaly disabled.
              <i className="block font-normal">Please contact hackathonmarketplace@gmail.com</i>
            </Message>
          }
        </div>
      }
      <Curriculum
        isLoading={isLoading}
        locked={isLocked}
        productState={productState}
      />
      <Modal />
    </>
  )
}

export function getStaticPaths() {
  const { data } = getAllProducts()

  return {
    paths: data.map(c => ({
      params: {
        slug: c.slug
      }
    })),
    fallback: false
  }
}


export function getStaticProps({params}) {
  const { data } = getAllProducts()
  const product = data.filter(c => c.slug === params.slug)[0]

  return {
    props: {
      product
    }
  }
}

Product.Layout = BaseLayout
