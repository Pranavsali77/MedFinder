package com.medfinder.medfinder_backend.dto;

public class DashboardStatsDTO {

    private long totalOrders;
    private double totalRevenue;
    private long totalUsers;
    private long lowStockCount;

    public DashboardStatsDTO(long totalOrders,
                             double totalRevenue,
                             long totalUsers,
                             long lowStockCount) {
        this.totalOrders = totalOrders;
        this.totalRevenue = totalRevenue;
        this.totalUsers = totalUsers;
        this.lowStockCount = lowStockCount;
    }

    public long getTotalOrders() { return totalOrders; }
    public double getTotalRevenue() { return totalRevenue; }
    public long getTotalUsers() { return totalUsers; }
    public long getLowStockCount() { return lowStockCount; }
}