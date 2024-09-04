import PageHeader from '../_components/PageHeader'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { prisma } from '@/db/db'
import { CheckCircle2, MoreVertical, XCircle } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/formatters'
import { DropdownMenu } from '@radix-ui/react-dropdown-menu'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ActiveToggleDropdownItem, DeleteDropdownItem } from './_components/ProductActions'


const ProductTable = async () => {

  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      priceInRupees: true,
      isAvailableForPurchase: true,
      _count: {select: {orders: true}}
    }, 
    orderBy: {name: "asc"}
  });

  if (products.length === 0 )
    return <p>No products found</p>

  return <Table>
    <TableHeader>
      <TableRow>
        <TableHead className='w-0 '> <span className='sr-only'>Available For Purchase</span></TableHead>
        <TableHead>Name</TableHead>
        <TableHead>Price</TableHead>
        <TableHead>Orders</TableHead>
        <TableHead className='w-0 '><span className='sr-only'>Actions</span></TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {
      products.map(product => (
          <TableRow key={product.id}>
            <TableCell>{product.isAvailableForPurchase ? 
            <><span className='sr-only'>Available</span>
            <CheckCircle2/>
            </>
            :
            <><span className='sr-only'>Unavailable</span>
            <XCircle className=' stroke-destructive'/>
            </>
            }</TableCell>
            <TableCell>{product.name}</TableCell>
            <TableCell>{formatCurrency(product.priceInRupees)}</TableCell>
            <TableCell>{formatNumber(product._count.orders)}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <MoreVertical/>
                  <span className='sr-only'>Actions</span>
                </DropdownMenuTrigger>

                <DropdownMenuContent>
                  <DropdownMenuItem asChild>
                    <a download href={`/admin/products/${product.id}/download`}>
                    Download
                    </a>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href={`/admin/products/${product.id}/edit`}>
                    Edit
                    </Link>
                  </DropdownMenuItem> 
                  <ActiveToggleDropdownItem id={product.id} isAvailableForPurchase={product.isAvailableForPurchase}/>
                  <DeleteDropdownItem id={product.id} disabled={product._count.orders > 0} />
                </DropdownMenuContent>
              </DropdownMenu>
              </TableCell>
      </TableRow>
        ))
      }
    </TableBody>
  </Table>
}

const AdminProductPage = () => {
  return (
    <>
    <div className='flex justify-between items-center gap-4'>
      <PageHeader>Products</PageHeader>
      <Button asChild>
        <Link href="/admin/products/new">Add Product</Link>
      </Button>
    </div>
    <ProductTable/>
    </>
  )
}

export default AdminProductPage