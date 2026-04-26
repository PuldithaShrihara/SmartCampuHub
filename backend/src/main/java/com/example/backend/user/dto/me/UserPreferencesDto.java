package com.example.backend.user.dto.me;

/**
 * Wire format for {@link com.example.backend.user.entity.UserPreferences}. All fields nullable
 * so we can support partial PATCH updates from the settings UI.
 */
public class UserPreferencesDto {

	private Boolean emailNotifications;
	private Boolean inAppNotifications;
	private Boolean notifyBookings;
	private Boolean notifyIncidents;
	private Boolean notifyAnnouncements;
	private String quietHoursStart;
	private String quietHoursEnd;

	private String defaultResourceCategory;
	private Integer defaultBookingDurationMins;
	private String bookingViewMode;

	private String defaultIncidentCategory;
	private String defaultIncidentLocation;
	private Boolean showOnlyMyIncidents;

	private String theme;
	private String language;
	private String timeZone;
	private Integer itemsPerPage;

	public UserPreferencesDto() {
	}

	public Boolean getEmailNotifications() {
		return emailNotifications;
	}

	public void setEmailNotifications(Boolean emailNotifications) {
		this.emailNotifications = emailNotifications;
	}

	public Boolean getInAppNotifications() {
		return inAppNotifications;
	}

	public void setInAppNotifications(Boolean inAppNotifications) {
		this.inAppNotifications = inAppNotifications;
	}

	public Boolean getNotifyBookings() {
		return notifyBookings;
	}

	public void setNotifyBookings(Boolean notifyBookings) {
		this.notifyBookings = notifyBookings;
	}

	public Boolean getNotifyIncidents() {
		return notifyIncidents;
	}

	public void setNotifyIncidents(Boolean notifyIncidents) {
		this.notifyIncidents = notifyIncidents;
	}

	public Boolean getNotifyAnnouncements() {
		return notifyAnnouncements;
	}

	public void setNotifyAnnouncements(Boolean notifyAnnouncements) {
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

	public Boolean getShowOnlyMyIncidents() {
		return showOnlyMyIncidents;
	}

	public void setShowOnlyMyIncidents(Boolean showOnlyMyIncidents) {
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
}
