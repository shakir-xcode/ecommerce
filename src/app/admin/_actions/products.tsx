"use server"

import { prisma } from "@/db/db"
import { z } from "zod"
import fs from "fs/promises"
import { existsSync } from "fs"
import { notFound, redirect } from "next/navigation"
import { Product } from "@prisma/client"

const FILE_DIR = "products";
const IMAGE_DIR = "public/products";

const fileSchema = z.instanceof(File, {message: "Required"})
// const imageSchema = fileSchema.refine(file => file.size === 0 || file.type.startsWith("image/"))

const addSchema = z.object({
    name: z.string().min(1),
    description: z.string().trim().min(1),
    priceInRupees: z.coerce.number().int().min(1),
    file: fileSchema.refine(file => file.size > 0, "Required"),
    image: fileSchema.refine(file => file.size > 0, "Required"),
})

export async function addProduct (prevState: unknown,formData: FormData) {
    const result = addSchema.safeParse(Object.fromEntries(formData.entries()));
    if(!result.success)
        return result.error.formErrors.fieldErrors

    const data = result.data;
 
    if(!existsSync(FILE_DIR))
        await fs.mkdir(FILE_DIR,{recursive: true})
    const filePath = `products/${crypto.randomUUID()}-${data.file.name}`;
    await fs.writeFile(filePath, Buffer.from(await data.file.arrayBuffer()))

    if(!existsSync(IMAGE_DIR))
        await fs.mkdir(IMAGE_DIR,{recursive: true})
    const imagePath = `products/${crypto.randomUUID()}-${data.image.name}`;
    await fs.writeFile(`public/${imagePath}`, Buffer.from(await data.image.arrayBuffer()))


    await prisma.product.create({
        data: {
            // isAvailableForPurchase: false,
            name: data.name,
            description: data.description,
            priceInRupees: data.priceInRupees,
            filePath,
            imagePath
        }
    })

    redirect("/admin/products");
}

const editSchema = addSchema.extend({
    file: fileSchema.optional(),
    image: fileSchema.optional()
})

export async function updateProduct ( id: string, prevState: unknown,formData: FormData) {
    const result = editSchema.safeParse(Object.fromEntries(formData.entries()));
    if(!result.success)
        return result.error.formErrors.fieldErrors

    const data = result.data;
    const product = await prisma.product.findUnique({where: {id}})

    if (product == null) 
        return notFound();

    let filePath = product.filePath
    if(data.file != null && data.file.size > 0) {
        await fs.unlink(product.filePath)
        filePath = `products/${crypto.randomUUID()}-${data.file.name}`;
        await fs.writeFile(filePath, Buffer.from(await data.file.arrayBuffer()))
}

let imagePath = product.imagePath;
if(data.image != null && data.image.size > 0) {
    await fs.unlink(`public/${product.imagePath}`)
        imagePath = `products/${crypto.randomUUID()}-${data.image.name}`;
        await fs.writeFile(`public/${imagePath}`, Buffer.from(await data.image.arrayBuffer()))
}

    await prisma.product.update({
        where: {id},
        data: {
            name: data.name,
            description: data.description,
            priceInRupees: data.priceInRupees,
            filePath,
            imagePath
        }
    })

    redirect("/admin/products");
}

export const toggleProductAvailability = async (id: string, isAvailableForPurchase: boolean) => {
   try {
     const prod = await prisma.product.update({
         where: { id },
         data: {isAvailableForPurchase}
     })
     
   } catch (error ) {
    console.log(error)
   } 
}

export const deleteProduct = async (id : string) => {
    const product = await prisma.product.delete({
        where: {id}
    })

    if(!product) return notFound()
    
    await fs.unlink(product.filePath);
    await fs.unlink(`public/${product.imagePath}`);
}