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
import com.example.backend.booking.entity.Booking;

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

			String htmlContent = String.format(
					"<h2>Booking Confirmation</h2>" +
							"<p>Dear %s,</p>" +
							"<p>Your booking request has been <strong>APPROVED</strong>.</p>" +
							"<p><strong>Details:</strong></p>" +
							"<ul>" +
							"<li><strong>Resource:</strong> %s</li>" +
							"<li><strong>Date:</strong> %s</li>" +
							"<li><strong>Time:</strong> %s - %s</li>" +
							"</ul>" +
							"<p>Show this QR code at the hall entrance for verification:</p>" +
							"<img src='cid:qrCodeImage' alt='Booking QR Code' />" +
							"<br/><br/>" +
							"<p>Thank you for using Smart Campus Hub!</p>",
					booking.getUser().getFullName(),
					booking.getResource().getName(),
					booking.getBookingDate(),
					booking.getStartTime().format(DateTimeFormatter.ofPattern("HH:mm")),
					booking.getEndTime().format(DateTimeFormatter.ofPattern("HH:mm")));

			helper.setText(htmlContent, true); // true = HTML

			// Add the inline QR image
			helper.addInline("qrCodeImage", new ByteArrayResource(qrImageContent), "image/png");

			mailSender.send(message);
			log.info("Booking approval email with QR sent successfully to {}", toEmail);
		} catch (Exception ex) {
			log.error("Failed to send booking approval email to {}", toEmail, ex);
		}
	}
}
