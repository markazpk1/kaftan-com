import { motion } from "framer-motion";
import {
  DollarSign, ShoppingCart, Users, Package, TrendingUp, TrendingDown,
  ArrowUpRight, Eye, Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from "recharts";

const revenueData = [];

const categoryData = [];

const topProducts = [];

const recentOrders = [];

const statusColor: Record<string, string> = {
  Processing: "bg-amber-100 text-amber-700",
  Shipped: "bg-blue-100 text-blue-700",
  Delivered: "bg-green-100 text-green-700",
};

const stats = [
  { label: "Total Revenue", value: "₨ 0", change: "0%", up: true, icon: DollarSign, sub: "This month" },
  { label: "Total Orders", value: "0", change: "0%", up: true, icon: ShoppingCart, sub: "This month" },
  { label: "Total Customers", value: "0", change: "0%", up: true, icon: Users, sub: "Active users" },
  { label: "Total Products", value: "0", change: "0", up: true, icon: Package, sub: "In catalog" },
];

const AdminDashboard = () => (
  <div className="space-y-6">
    <div>
      <h1 className="font-heading text-3xl font-semibold text-foreground">Dashboard</h1>
      <p className="font-body text-sm text-muted-foreground">Welcome back! Here's your store overview.</p>
    </div>

    {/* Stats Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-card border border-border rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <s.icon size={20} className="text-primary" />
            </div>
            <span className={`flex items-center gap-1 text-xs font-body font-medium ${s.up ? "text-green-600" : "text-red-500"}`}>
              {s.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {s.change}
            </span>
          </div>
          <p className="font-heading text-2xl font-semibold text-foreground">{s.value}</p>
          <p className="font-body text-xs text-muted-foreground mt-0.5">{s.sub}</p>
        </motion.div>
      ))}
    </div>

    {/* Charts Row */}
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      {/* Revenue Chart */}
      <div className="xl:col-span-2 bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg font-semibold text-foreground">Revenue Overview</h3>
          <Badge variant="secondary" className="font-body text-[10px]">Last 7 months</Badge>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={revenueData}>
            <defs>
              <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(0, 72%, 40%)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(0, 72%, 40%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 15%, 88%)" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: "Outfit" }} stroke="hsl(20, 5%, 50%)" />
            <YAxis tick={{ fontSize: 11, fontFamily: "Outfit" }} stroke="hsl(20, 5%, 50%)" />
            <Tooltip contentStyle={{ fontFamily: "Outfit", fontSize: 12, borderRadius: 8 }} />
            <Area type="monotone" dataKey="revenue" stroke="hsl(0, 72%, 40%)" fill="url(#revGradient)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Category Pie */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Sales by Category</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
              {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <Tooltip contentStyle={{ fontFamily: "Outfit", fontSize: 12, borderRadius: 8 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {categoryData.map(c => (
            <div key={c.name} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
              <span className="font-body text-xs text-muted-foreground">{c.name} ({c.value}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Bottom Row */}
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {/* Recent Orders */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg font-semibold text-foreground">Recent Orders</h3>
          <a href="/admin/orders" className="font-body text-xs text-primary hover:underline flex items-center gap-1">
            View All <ArrowUpRight size={12} />
          </a>
        </div>
        <div className="space-y-3">
          {recentOrders.map(o => (
            <div key={o.id} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                  <ShoppingCart size={14} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="font-body text-sm font-medium text-foreground">{o.id}</p>
                  <p className="font-body text-xs text-muted-foreground">{o.customer}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-body text-sm font-medium text-foreground">${o.total.toLocaleString()}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-body ${statusColor[o.status]}`}>{o.status}</span>
                  <span className="text-[10px] text-muted-foreground font-body flex items-center gap-0.5"><Clock size={9} /> {o.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg font-semibold text-foreground">Top Products</h3>
          <Badge variant="secondary" className="font-body text-[10px]">This month</Badge>
        </div>
        <div className="space-y-3">
          {topProducts.map((p, i) => (
            <div key={p.name} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center font-body text-xs font-medium text-muted-foreground">
                  {i + 1}
                </span>
                <div>
                  <p className="font-body text-sm font-medium text-foreground truncate max-w-[200px]">{p.name}</p>
                  <p className="font-body text-xs text-muted-foreground">{p.sales} sold</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <p className="font-body text-sm font-medium text-foreground">${p.revenue.toLocaleString()}</p>
                {p.trend === "up" ? <TrendingUp size={14} className="text-green-500" /> : <TrendingDown size={14} className="text-red-400" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default AdminDashboard;
