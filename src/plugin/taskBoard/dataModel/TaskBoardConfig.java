package plugin.taskBoard.dataModel;

public class TaskBoardConfig {
	private String projectID;
	private String sprintID;
	private String workStages;

	public TaskBoardConfig( String projectID, String sprintID, String workStages ) {
		this.projectID = projectID;
		this.sprintID = sprintID;
//		System.out.println("workStages: "+workStages);
		this.workStages = workStages;
//		System.out.println("workStages: "+workStages);
	}

	public String toString(){
		return "projectID:"+ projectID + " " +"sprintID:"+ sprintID + " " + "workStages:" + workStages;
	}
	
	public boolean equals( Object object ){
		return this.toString().equals( object.toString() );
	}
	
	public String getProjectID() {
		return projectID;
	}

	public void setProjectID(String projectID) {
		this.projectID = projectID;
	}

	public String getSprintID() {
		return sprintID;
	}

	public void setSprintID(String sprintID) {
		this.sprintID = sprintID;
	}

	public String getWorkStages() {
//		System.out.println("this.workStages: "+this.workStages);
		return workStages;
	}

	public void setWorkStages(String workStages) {
//		System.out.println("this.workStages: "+this.workStages);
		this.workStages = workStages;
//		System.out.println("this.workStages: "+this.workStages);
	}
}
