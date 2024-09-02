
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/db/db'
import React from 'react'
import {formatCurrency, formatNumber} from "@/lib/formatters"


const getSalesData = async () => {
        const data = await prisma.order.aggregate({
            _sum: {pricePaidInRupees: true},
            _count: true
        })

        return {
            amount: (data._sum.pricePaidInRupees || 0),
            numberOfSales: data._count
        }
    }


    const getUserData = async () => {

         
        const userCount = await prisma.user.count()
        const data = await prisma.order.aggregate({
            _sum: {pricePaidInRupees: true},
        })

        return {
            userCount,
            avgValuePerUser: !userCount ? 0 : (data._sum.pricePaidInRupees || 0 )/ userCount
        }
    }

    const getProductData = async () => {
        const [activeCount, InactiveCount] = await Promise.all ([
            prisma.product.count({where : {isAvailableForPurchase: true}}),
            prisma.product.count({where : {isAvailableForPurchase: false}}),
        ]);
        return{
            activeCount,
            InactiveCount
        }
    }
    

const AdminDashboard = async () => {

    const [salesData, userData, productData] = await Promise.all([
        getSalesData(), 
        getUserData(),
        getProductData()
    ]);

  return (
    <div className=' grid grid-cols-1 md:grid-cols-2
    lg:grid-cols-3 gap-4'>
     <DashboardCard 
     title='Sales' 
     subtitle={`${formatNumber(salesData.numberOfSales)} Orders`} 
     body={formatCurrency(salesData.amount)}
     />
    <DashboardCard 
        title='Customers' 
        subtitle={`${formatCurrency(userData.avgValuePerUser)} Average Value`} 
        body={formatNumber(userData.userCount)}
     />

<DashboardCard 
        title='Active Products' 
        subtitle={`${formatCurrency(productData.InactiveCount)} Inactive`} 
        body={formatNumber(productData.activeCount)}
     />

    </div>
  )
}

type DashboardCardProps = {
    title: string
    subtitle: string
    body: string
}

const DashboardCard = ({title, subtitle, body} : DashboardCardProps) => {
    return (
        <Card>
        <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
            <p>{body}</p>
        </CardContent>
    </Card>
    )
}

export default AdminDashboard