
import { Hero } from "@components/ui/common"
import { ProductList, ProductCard } from "@components/ui/product"
import { BaseLayout } from "@components/ui/layout"
import { getAllProducts } from "@content/products/fetcher"

export default function Home({products}) {
  return (
    <>
      <Hero />
      <ProductList
        products={products}
      >
      {product =>
        <ProductCard
          key={product.id}
          product={product}
        />
      }
      </ProductList>
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

Home.Layout = BaseLayout
