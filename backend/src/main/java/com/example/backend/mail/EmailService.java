package com.example.backend.mail;

import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.web.util.HtmlUtils;

import com.example.backend.booking.entity.Booking;
import com.example.backend.booking.entity.BookingType;
import com.example.backend.resource.entity.Resource;
import com.example.backend.user.entity.User;

@Service
public class EmailService {

	private static final Logger log = LoggerFactory.getLogger(EmailService.class);

	private final JavaMailSender mailSender;

	@Value("${app.email.from:${spring.mail.username}}")
	private String fromAddress;

	@Value("${app.email.enabled:true}")
	private boolean emailEnabled;

	@Value("${app.email.sender-name:Smart Campus Hub}")
	private String senderName;

	public boolean isEnabled() {
		return emailEnabled;
	}

	public EmailService(JavaMailSender mailSender) {
		this.mailSender = mailSender;
	}

	public void sendVerificationOtp(String toEmail, String otp) {
		if (!emailEnabled) {
			log.info("Email disabled (app.email.enabled=false); skipping verification mail to {}", toEmail);
			return;
		}
		if (fromAddress == null || fromAddress.isBlank()) {
			throw new IllegalStateException("app.email.from (or spring.mail.username) must be set to send mail");
		}

		try {
			MimeMessage message = mailSender.createMimeMessage();
			MimeMessageHelper helper = new MimeMessageHelper(message, StandardCharsets.UTF_8.name());
			helper.setFrom(new InternetAddress(fromAddress, senderName, StandardCharsets.UTF_8.name()));
			helper.setTo(toEmail);
			helper.setSubject("Your Smart Campus Hub verification OTP");
			helper.setText(
					"Welcome to Smart Campus Hub.\n\n"
							+ "Use this 6-digit OTP to verify your account:\n\n"
							+ otp + "\n\nThis OTP expires in 5 minutes.\n\n"
							+ "If you did not create an account, you can ignore this email.",
					false);
			mailSender.send(message);
			log.info("Verification OTP email sent successfully to {}", toEmail);
		} catch (MailException ex) {
			log.error("Failed to send verification OTP email to {}", toEmail, ex);
			throw ex;
		} catch (Exception ex) {
			log.error("Unexpected error while building verification OTP email for {}", toEmail, ex);
			throw new IllegalStateException("Could not send verification OTP email", ex);
		}
	}

	public void sendPasswordResetOtp(String toEmail, String otp) {
		if (!emailEnabled) {
			log.info("Email disabled (app.email.enabled=false); skipping password reset OTP mail to {}", toEmail);
			return;
		}
		if (fromAddress == null || fromAddress.isBlank()) {
			throw new IllegalStateException("app.email.from (or spring.mail.username) must be set to send mail");
		}

		try {
			MimeMessage message = mailSender.createMimeMessage();
			MimeMessageHelper helper = new MimeMessageHelper(message, StandardCharsets.UTF_8.name());
			helper.setFrom(new InternetAddress(fromAddress, senderName, StandardCharsets.UTF_8.name()));
			helper.setTo(toEmail);
			helper.setSubject("Your Smart Campus Hub password reset OTP");
			helper.setText(
					"We received a request to reset your password.\n\n"
							+ "Use this 6-digit OTP to reset your password:\n\n"
							+ otp + "\n\nThis OTP expires in 5 minutes.\n\n"
							+ "If you did not request a password reset, ignore this email.",
					false);
			mailSender.send(message);
			log.info("Password reset OTP email sent successfully to {}", toEmail);
		} catch (MailException ex) {
			log.error("Failed to send password reset OTP email to {}", toEmail, ex);
			throw ex;
		} catch (Exception ex) {
			log.error("Unexpected error while building password reset OTP email for {}", toEmail, ex);
			throw new IllegalStateException("Could not send password reset OTP email", ex);
		}
	}

	public void sendBookingApprovalEmail(Booking booking, byte[] qrImageContent) {
		if (!emailEnabled) {
			log.info("Email disabled; skipping approval mail to {}", booking.getUser().getEmail());
			return;
		}

		String toEmail = booking.getUser().getEmail();
		try {
			MimeMessage message = mailSender.createMimeMessage();
			// true indicates multipart for inline image
			MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());

			helper.setFrom(new InternetAddress(fromAddress, senderName, StandardCharsets.UTF_8.name()));
			helper.setTo(toEmail);
			helper.setSubject("Booking Approved - Smart Campus Hub");

			DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH:mm");
			DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("MMMM d, yyyy");

			User user = booking.getUser();
			Resource resource = booking.getResource();
			String dearName = user != null && user.getFullName() != null ? user.getFullName() : "Student";

			String resourceName = resource != null ? nz(resource.getName()) : "N/A";
			String resourceTypeLabel = formatResourceTypeLabel(resource);
			String location = resource != null ? nz(resource.getLocation()) : "N/A";
			String usernameLabel = user != null ? nz(user.getFullName()) : "N/A";
			String dateStr = booking.getBookingDate() != null ? booking.getBookingDate().format(dateFmt) : "N/A";
			String startStr = booking.getStartTime() != null ? booking.getStartTime().format(timeFmt) : "?";
			String endStr = booking.getEndTime() != null ? booking.getEndTime().format(timeFmt) : "?";
			String timeRange = startStr + " - " + endStr;
			String attendeesLabel = formatAttendeesLabel(booking);

			String plainBlock = "Resource name: " + resourceName + "\n"
					+ "Resource type: " + resourceTypeLabel + "\n"
					+ "Location: " + location + "\n"
					+ "Username: " + usernameLabel + "\n"
					+ "Date: " + dateStr + "\n"
					+ "Time: " + timeRange + "\n"
					+ "Attendees: " + attendeesLabel + "\n";

			String plainText = "Booking confirmation\n\n"
					+ "Dear " + dearName + ",\n\n"
					+ "Your booking request has been APPROVED.\n\n"
					+ plainBlock + "\n"
					+ "Show the QR code below at the venue for verification.\n\n"
					+ "Thank you for using Smart Campus Hub!\n";

			String htmlBlock = "<ul>"
					+ "<li><strong>Resource name:</strong> " + HtmlUtils.htmlEscape(resourceName) + "</li>"
					+ "<li><strong>Resource type:</strong> " + HtmlUtils.htmlEscape(resourceTypeLabel) + "</li>"
					+ "<li><strong>Location:</strong> " + HtmlUtils.htmlEscape(location) + "</li>"
					+ "<li><strong>Username:</strong> " + HtmlUtils.htmlEscape(usernameLabel) + "</li>"
					+ "<li><strong>Date:</strong> " + HtmlUtils.htmlEscape(dateStr) + "</li>"
					+ "<li><strong>Time:</strong> " + HtmlUtils.htmlEscape(timeRange) + "</li>"
					+ "<li><strong>Attendees:</strong> " + HtmlUtils.htmlEscape(attendeesLabel) + "</li>"
					+ "</ul>";

			String htmlContent = "<h2>Booking confirmation</h2>"
					+ "<p>Dear " + HtmlUtils.htmlEscape(dearName) + ",</p>"
					+ "<p>Your booking request has been <strong>APPROVED</strong>.</p>"
					+ "<p><strong>Details</strong></p>"
					+ htmlBlock
					+ "<p>Show this QR code at the venue for verification:</p>"
					+ "<img src=\"cid:qrCodeImage\" alt=\"Booking QR Code\" />"
					+ "<br/><br/>"
					+ "<p>Thank you for using Smart Campus Hub!</p>";

			helper.setText(plainText, htmlContent);

			helper.addInline("qrCodeImage", new ByteArrayResource(qrImageContent), "image/png");

			mailSender.send(message);
			log.info("Booking approval email with QR sent successfully to {}", toEmail);
		} catch (Exception ex) {
			log.error("Failed to send booking approval email to {}", toEmail, ex);
		}
	}

	private static String nz(String s) {
		return s != null && !s.isBlank() ? s : "N/A";
	}

	private static String formatResourceTypeLabel(Resource resource) {
		if (resource == null || resource.getType() == null) {
			return "N/A";
		}
		return resource.getType().name().replace('_', ' ');
	}

	private static String formatAttendeesLabel(Booking booking) {
		if (booking.getBookingType() == BookingType.EQUIPMENT) {
			Integer q = booking.getQuantityRequested();
			return q != null ? String.valueOf(q) : "N/A";
		}
		Integer n = booking.getExpectedAttendees();
		return n != null ? String.valueOf(n) : "N/A";
	}
}
