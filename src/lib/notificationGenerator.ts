import { notificationService } from './notificationService';

// Sample notification templates for different types
const notificationTemplates = {
  order: [
    { title: "New Order Received", message: "Order #{orderNumber} placed by {customerName} for ₦{amount}" },
    { title: "Order Payment Confirmed", message: "Payment for Order #{orderNumber} has been confirmed" },
    { title: "Order Shipped", message: "Order #{orderNumber} has been shipped and is on its way" },
    { title: "Order Delivered", message: "Order #{orderNumber} was delivered successfully" },
    { title: "Order Cancelled", message: "Customer cancelled Order #{orderNumber}" },
  ],
  customer: [
    { title: "New Customer Registration", message: "{customerName} just created an account" },
    { title: "Customer Profile Updated", message: "{customerName} updated their profile information" },
    { title: "Customer Birthday", message: "Today is {customerName}'s birthday! Send them a special offer" },
    { title: "VIP Customer Alert", message: "{customerName} has reached VIP status" },
  ],
  inventory: [
    { title: "Low Stock Alert", message: "{productName} is running low ({stockCount} left)" },
    { title: "Out of Stock", message: "{productName} is now out of stock" },
    { title: "Stock Replenished", message: "{productName} has been restocked ({stockCount} units)" },
    { title: "Inventory Report Ready", message: "Monthly inventory report is now available" },
  ],
  alert: [
    { title: "Payment Failed", message: "Payment for Order #{orderNumber} was declined" },
    { title: "Refund Requested", message: "Customer requested refund for Order #{orderNumber}" },
    { title: "System Maintenance", message: "Scheduled maintenance will begin in {time}" },
    { title: "Security Alert", message: "Unusual activity detected on account {account}" },
    { title: "API Rate Limit", message: "API rate limit exceeded. Please check your usage" },
  ],
};

const sampleData = {
  customers: ["Sarah Johnson", "Amara Obi", "Chidi Eze", "Funke Adebayo", "Tunde Balogun"],
  products: ["Royal Blue Agbada", "Gold Kaftan", "Purple Dashiki", "Green Aso Oke", "Red Gele"],
  orderNumbers: [1042, 1043, 1044, 1045, 1046, 1047, 1048, 1049, 1050],
  amounts: [85000, 120000, 65000, 95000, 150000, 75000, 110000, 88000, 135000],
  stockCounts: [3, 0, 12, 1, 8, 15, 2, 0, 6],
  times: ["30 minutes", "1 hour", "2 hours", "6 hours", "12 hours"],
};

// Generate a random notification
export const generateRandomNotification = async () => {
  const types = ['order', 'customer', 'inventory', 'alert'] as const;
  const randomType = types[Math.floor(Math.random() * types.length)];
  const templates = notificationTemplates[randomType];
  const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
  
  let message = randomTemplate.message;
  
  // Replace placeholders with sample data
  message = message.replace('{customerName}', sampleData.customers[Math.floor(Math.random() * sampleData.customers.length)]);
  message = message.replace('{productName}', sampleData.products[Math.floor(Math.random() * sampleData.products.length)]);
  message = message.replace('{orderNumber}', sampleData.orderNumbers[Math.floor(Math.random() * sampleData.orderNumbers.length)].toString());
  message = message.replace('{amount}', sampleData.amounts[Math.floor(Math.random() * sampleData.amounts.length)].toString());
  message = message.replace('{stockCount}', sampleData.stockCounts[Math.floor(Math.random() * sampleData.stockCounts.length)].toString());
  message = message.replace('{time}', sampleData.times[Math.floor(Math.random() * sampleData.times.length)]);
  message = message.replace('{account}', "admin@fashionspectrum.com");
  
  try {
    await notificationService.createNotification({
      title: randomTemplate.title,
      message,
      type: randomType,
    });
  } catch (error) {
    console.error('Failed to generate notification:', error);
  }
};

// Start generating notifications periodically (for demo purposes)
export const startNotificationGeneration = (intervalMs: number = 15000) => {
  return setInterval(() => {
    // Only generate notifications 30% of the time to avoid spam
    if (Math.random() < 0.3) {
      generateRandomNotification();
    }
  }, intervalMs);
};

// Generate some initial notifications for testing
export const generateInitialNotifications = async () => {
  const initialNotifications = [
    {
      title: "New Order Received",
      message: "Order #1042 placed by Sarah Johnson for ₦85,000",
      type: "order" as const,
    },
    {
      title: "Low Stock Alert",
      message: "Royal Blue Agbada is running low (3 left)",
      type: "inventory" as const,
    },
    {
      title: "New Customer Registration",
      message: "Amara Obi just created an account",
      type: "customer" as const,
    },
    {
      title: "Payment Failed",
      message: "Payment for Order #1039 was declined",
      type: "alert" as const,
    },
    {
      title: "Order Delivered",
      message: "Order #1035 was delivered successfully",
      type: "order" as const,
    },
  ];

  for (const notification of initialNotifications) {
    try {
      await notificationService.createNotification(notification);
    } catch (error) {
      console.error('Failed to create initial notification:', error);
    }
  }
};
