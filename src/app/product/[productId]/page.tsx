import { notFound } from "next/navigation";
import { type Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { getProduct, getProductsList } from "@/api/products";
import { formatPrice } from "@/utils";
import { ProductImage } from "@/components/atoms/ProductImage";
import { SuggestedProducts } from "@/components/organisms/SuggestedProducts";
import { ProductVariantPicker } from "@/components/molecules/ProductVariantPicker";
import { AddToCartButton } from "@/components/atoms/AddToCartButton";

import { getOrCreateCart, addToCart } from "@/api/cart";

export const generateStaticParams = async () => {
	const products = await getProductsList();
	return products
		.map((product) => {
			return {
				productId: product.id,
			};
		})
		.slice(0, 3);
};

export const generateMetadata = async ({
	params,
}: {
	params: { productId: string };
}): Promise<Metadata> => {
	const product = await getProduct(params.productId);
	if (!product) {
		notFound();
	}

	const { name, description, images } = product;
	const image = images[0]?.url;
	const ogImages = image ? [image] : [];

	return {
		title: name,
		description: description,
		openGraph: {
			title: name,
			description: description,
			images: ogImages,
		},
	};
};

export default async function ProductPage({ params }: { params: { productId: string } }) {
	const product = await getProduct(params.productId);
	if (!product) {
		notFound();
	}

	const { description, images, name, price, categories } = product;
	const image = images[0]?.url;
	const category = categories[0]?.name;

	async function addProductToCartAction(formData: FormData) {
		"use server";
		console.log("addProductToCartAction");
		console.log(formData);

		const cart = await getOrCreateCart();
		cookies().set("cartId", cart.id, {
			httpOnly: true,
			sameSite: "lax",
		});
		await addToCart(cart.id, params.productId);
	}

	return (
		<article>
			<div className="flex flex-col gap-4 md:flex-row">
				<ProductImage src={image} alt={name} />
				<section className="w-full">
					<h3 className="title-font text-sm uppercase tracking-widest text-gray-500">{category}</h3>
					<h1 className="title-font mb-1 text-3xl font-medium text-gray-900">{name}</h1>
					{/* todo: implement MDX */}
					{/* todo: implement rating component (stars) */}
					<p className="border-gray-1 border-b-2 pb-5 leading-relaxed">{description}</p>
					<ProductVariantPicker id={product.id} />
					<div className="mt-5 flex justify-between align-baseline">
						<p className="text-2xl font-medium text-gray-900">{formatPrice(price / 100)}</p>
						<form action={addProductToCartAction}>
							<input type="hidden" name="productId" value={product.id} />
							<AddToCartButton />
						</form>
					</div>
				</section>
			</div>
			<section className="mt-4">
				<Suspense fallback={"loading"}>
					<SuggestedProducts />
				</Suspense>
			</section>
		</article>
	);
}
