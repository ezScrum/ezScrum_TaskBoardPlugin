package plugin.taskBoard.dataModel;

public class IssueInformation {
	private String projectID;
	private String sprintID;
	private String issueID;
	private String status;
	private String healthReport;

	public IssueInformation( String projectID, String sprintID, String issueID, String status, String healthReport ) {
		this.projectID = projectID;
		this.sprintID = sprintID;
		this.issueID = issueID;
		this.status = status;
		this.healthReport = healthReport;
	}

	public String getProjectID() {
		return this.projectID;
	}

	public void setProjectID(String projectID) {
		this.projectID = projectID;
	}

	public String getSprintID() {
		return this.sprintID;
	}

	public void setSprintID( String sprintID ) {
		this.sprintID = sprintID;
	}
	
	public String getIssueID() {
		return this.issueID;
	}

	public void setIssueID( String issueID ) {
		this.issueID = issueID;
	}

	public String getStatus() {
		return this.status;
	}

	public void set( String status ) {
		this.status = status;
	}
	
	public String getHealthReport() {
		return this.healthReport;
	}

	public void setHealthReport( String healthReport ) {
		this.healthReport = healthReport;
	}
}
