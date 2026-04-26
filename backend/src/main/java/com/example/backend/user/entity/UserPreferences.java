package com.example.backend.user.entity;

/**
 * Embedded user preferences stored on the {@link User} document. Defaults are picked to keep
 * the experience working even if the document was created before this class existed.
 */
public class UserPreferences {

	private boolean emailNotifications = true;
	private boolean inAppNotifications = true;
	private boolean notifyBookings = true;
	private boolean notifyIncidents = true;
	private boolean notifyAnnouncements = true;
	private String quietHoursStart;
	private String quietHoursEnd;

	private String defaultResourceCategory;
	private Integer defaultBookingDurationMins;
	private String bookingViewMode;

	private String defaultIncidentCategory;
	private String defaultIncidentLocation;
	private boolean showOnlyMyIncidents = true;

	private String theme;
	private String language;
	private String timeZone;
	private Integer itemsPerPage;

	public UserPreferences() {
	}

	public boolean isEmailNotifications() {
		return emailNotifications;
	}

	public void setEmailNotifications(boolean emailNotifications) {
		this.emailNotifications = emailNotifications;
	}

	public boolean isInAppNotifications() {
		return inAppNotifications;
	}

	public void setInAppNotifications(boolean inAppNotifications) {
		this.inAppNotifications = inAppNotifications;
	}

	public boolean isNotifyBookings() {
		return notifyBookings;
	}

	public void setNotifyBookings(boolean notifyBookings) {
		this.notifyBookings = notifyBookings;
	}

	public boolean isNotifyIncidents() {
		return notifyIncidents;
	}

	public void setNotifyIncidents(boolean notifyIncidents) {
		this.notifyIncidents = notifyIncidents;
	}

	public boolean isNotifyAnnouncements() {
		return notifyAnnouncements;
	}

	public void setNotifyAnnouncements(boolean notifyAnnouncements) {
		this.notifyAnnouncements = notifyAnnouncements;
	}

	public String getQuietHoursStart() {
		return quietHoursStart;
	}

	public void setQuietHoursStart(String quietHoursStart) {
		this.quietHoursStart = quietHoursStart;
	}

	public String getQuietHoursEnd() {
		return quietHoursEnd;
	}

	public void setQuietHoursEnd(String quietHoursEnd) {
		this.quietHoursEnd = quietHoursEnd;
	}

	public String getDefaultResourceCategory() {
		return defaultResourceCategory;
	}

	public void setDefaultResourceCategory(String defaultResourceCategory) {
		this.defaultResourceCategory = defaultResourceCategory;
	}

	public Integer getDefaultBookingDurationMins() {
		return defaultBookingDurationMins;
	}

	public void setDefaultBookingDurationMins(Integer defaultBookingDurationMins) {
		this.defaultBookingDurationMins = defaultBookingDurationMins;
	}

	public String getBookingViewMode() {
		return bookingViewMode;
	}

	public void setBookingViewMode(String bookingViewMode) {
		this.bookingViewMode = bookingViewMode;
	}

	public String getDefaultIncidentCategory() {
		return defaultIncidentCategory;
	}

	public void setDefaultIncidentCategory(String defaultIncidentCategory) {
		this.defaultIncidentCategory = defaultIncidentCategory;
	}

	public String getDefaultIncidentLocation() {
		return defaultIncidentLocation;
	}

	public void setDefaultIncidentLocation(String defaultIncidentLocation) {
		this.defaultIncidentLocation = defaultIncidentLocation;
	}

	public boolean isShowOnlyMyIncidents() {
		return showOnlyMyIncidents;
	}

	public void setShowOnlyMyIncidents(boolean showOnlyMyIncidents) {
		this.showOnlyMyIncidents = showOnlyMyIncidents;
	}

	public String getTheme() {
		return theme;
	}

	public void setTheme(String theme) {
		this.theme = theme;
	}

	public String getLanguage() {
		return language;
	}

	public void setLanguage(String language) {
		this.language = language;
	}

	public String getTimeZone() {
		return timeZone;
	}

	public void setTimeZone(String timeZone) {
		this.timeZone = timeZone;
	}

	public Integer getItemsPerPage() {
		return itemsPerPage;
	}

	public void setItemsPerPage(Integer itemsPerPage) {
		this.itemsPerPage = itemsPerPage;
	}

	public static UserPreferences withDefaults() {
		return new UserPreferences();
	}
}
