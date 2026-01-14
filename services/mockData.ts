import { Order, OrderStatus, SalesStat, ProductStat, GeoStat } from '../types';

// Helper to generate random dates within last 30 days
const getRandomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const provinces = ['Guangdong', 'Zhejiang', 'Beijing', 'Shanghai', 'Jiangsu', 'Sichuan', 'Fujian'];
const products = ['Summer Silk Dress', 'Vintage T-Shirt', 'Wireless Earbuds', 'Bamboo Cutting Board', 'Organic Green Tea', 'Ceramic Vase'];

export const generateMockOrders = (count: number): Order[] => {
  const orders: Order[] = [];
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 30);

  for (let i = 0; i < count; i++) {
    const statusValues = Object.values(OrderStatus);
    const status = statusValues[Math.floor(Math.random() * statusValues.length)];
    const product = products[Math.floor(Math.random() * products.length)];
    
    orders.push({
      id: `ORD-${Math.floor(Math.random() * 100000)}`,
      orderNumber: `WX${Date.now()}${i}`,
      customerName: `User_${Math.floor(Math.random() * 9999)}`,
      productName: product,
      amount: parseFloat((Math.random() * 200 + 50).toFixed(2)),
      status: status,
      date: getRandomDate(startDate, endDate).toISOString(),
      province: provinces[Math.floor(Math.random() * provinces.length)],
    });
  }
  return orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Aggregation logic (Simulating backend processing)
export const processStats = (orders: Order[]) => {
  const salesByDate: Record<string, { revenue: number; orders: number }> = {};
  const productSales: Record<string, number> = {};
  const geoDist: Record<string, number> = {};

  orders.forEach(order => {
    // Daily Stats
    const dateKey = order.date.split('T')[0];
    if (!salesByDate[dateKey]) salesByDate[dateKey] = { revenue: 0, orders: 0 };
    salesByDate[dateKey].revenue += order.amount;
    salesByDate[dateKey].orders += 1;

    // Product Stats
    if (!productSales[order.productName]) productSales[order.productName] = 0;
    productSales[order.productName] += 1;

    // Geo Stats
    if (!geoDist[order.province]) geoDist[order.province] = 0;
    geoDist[order.province] += 1;
  });

  const salesTrend: SalesStat[] = Object.keys(salesByDate)
    .sort()
    .map(date => ({
      date: date.substring(5), // MM-DD
      revenue: parseFloat(salesByDate[date].revenue.toFixed(2)),
      orders: salesByDate[date].orders
    }));

  const topProducts: ProductStat[] = Object.entries(productSales)
    .map(([name, sales]) => ({ name, sales }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  const geoStats: GeoStat[] = Object.entries(geoDist)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return { salesTrend, topProducts, geoStats };
};