package com.medfinder.medfinder_backend.controller.service;

import org.springframework.core.io.FileSystemResource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import com.medfinder.medfinder_backend.model.Order;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendPaymentSuccessEmailWithInvoice(String toEmail,
                                                   double amount,
                                                   String invoicePath) throws Exception {

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        helper.setFrom("yourgmail@gmail.com");
        helper.setTo(toEmail);
        helper.setSubject("Payment Successful - Invoice Attached");
        helper.setText("Your payment of ₹" + amount +
                " was successful.\n\nInvoice is attached.");

        FileSystemResource file = new FileSystemResource(invoicePath);
        helper.addAttachment("Invoice.pdf", file);

        mailSender.send(message); 
    }
    public void sendOrderConfirmationEmail(Order order) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        helper.setFrom("pksali45@gmail.com");
        helper.setTo(order.getUser().getEmail());
        helper.setSubject("MedFinder: Order Confirmation #" + order.getId());
        
        String medicineName = order.getInventory() != null && order.getInventory().getMedicine() != null ? order.getInventory().getMedicine().getName() : "Medication";
        String pharmacyName = order.getInventory() != null && order.getInventory().getPharmacy() != null ? order.getInventory().getPharmacy().getName() : "the pharmacy";
        String pharmacyAddress = order.getInventory() != null && order.getInventory().getPharmacy() != null ? order.getInventory().getPharmacy().getAddress() + ", " + order.getInventory().getPharmacy().getCity() : "Not available";
        String pharmacyPhone = order.getInventory() != null && order.getInventory().getPharmacy() != null ? order.getInventory().getPharmacy().getPhone() : "Not available";
        double total = order.getQuantity() * (order.getInventory() != null ? order.getInventory().getPrice() : 0);

        String htmlMsg = "<h3>Thank you for your order, " + order.getUser().getName() + "!</h3>" +
                         "<p>Your order for <b>" + order.getQuantity() + "x " + medicineName + "</b> has been successfully placed at <b>" + pharmacyName + "</b>.</p>" +
                         "<p><b>Pharmacy Address:</b> " + pharmacyAddress + "<br/>" +
                         "<b>Pharmacy Contact:</b> " + pharmacyPhone + "</p>" +
                         "<p><b>Order Type:</b> " + order.getOrderType() + "<br/>" +
                         "<b>Total Amount:</b> ₹" + String.format("%.2f", total) + "</p>" +
                         "<p>You will receive an official invoice upon completion.</p>";

        helper.setText(htmlMsg, true);
        mailSender.send(message);
    }

    public void sendPickupReminderEmail(Order order) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        helper.setFrom("pksali45@gmail.com");
        helper.setTo(order.getUser().getEmail());
        helper.setSubject("MedFinder: Pickup Reminder for Order #" + order.getId());
        
        String pharmacyName = order.getInventory() != null && order.getInventory().getPharmacy() != null ? order.getInventory().getPharmacy().getName() : "the pharmacy";
        String pharmacyAddress = order.getInventory() != null && order.getInventory().getPharmacy() != null ? order.getInventory().getPharmacy().getAddress() + ", " + order.getInventory().getPharmacy().getCity() : "Not available";
        String pharmacyPhone = order.getInventory() != null && order.getInventory().getPharmacy() != null ? order.getInventory().getPharmacy().getPhone() : "Not available";

        String htmlMsg = "<h3>Pickup Reminder</h3>" +
                         "<p>Hi " + order.getUser().getName() + ",</p>" +
                         "<p>Your order #" + order.getId() + " at <b>" + pharmacyName + "</b> has been waiting for over an hour.</p>" +
                         "<p><b>Pharmacy Address:</b> " + pharmacyAddress + "<br/>" +
                         "<b>Pharmacy Contact:</b> " + pharmacyPhone + "</p>" +
                         "<p>Please ensure you pick it up soon to guarantee availability!</p>";

        helper.setText(htmlMsg, true);
        mailSender.send(message);
    }

    public void sendSimpleEmail(String toEmail,
            String subject,
            String body) {

			SimpleMailMessage message = new SimpleMailMessage();
			message.setFrom("pksali45@gmail.com");
			message.setTo(toEmail);
			message.setSubject(subject);
			message.setText(body);
			
			mailSender.send(message);
}
}