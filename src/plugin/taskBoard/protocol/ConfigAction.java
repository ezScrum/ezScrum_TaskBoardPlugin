package plugin.taskBoard.protocol;

import java.io.IOException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;

import javax.servlet.http.HttpSession;

import ntut.csie.ezScrum.pic.core.IUserSession;
import ntut.csie.ezScrum.web.form.ProjectInfoForm;
import ntut.csie.ezScrum.web.internal.IProjectSummaryEnum;

import org.kohsuke.stapler.StaplerRequest;
import org.kohsuke.stapler.StaplerResponse;

import plugin.taskBoard.DAO.PluginConfigDAO;
import plugin.taskBoard.webservice.EzScrumWebServiceController;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

public class ConfigAction extends TaskBoardAction {
	private String mUserName;
	private String mEncodedPassword;
	private String mProjectId;
	private String mEzScrumURL;

	private void init(StaplerRequest request) {
		HttpSession session = request.getSession();
		ProjectInfoForm projectInfoForm = (ProjectInfoForm) session.getAttribute(IProjectSummaryEnum.PROJECT_INFO_FORM);
		IUserSession userSession = (IUserSession) session.getAttribute("UserSession");
		mUserName = userSession.getAccount().getAccount();
		mEncodedPassword = (String) session.getAttribute("passwordForPlugin");
		mProjectId = projectInfoForm.getName();
		mEzScrumURL = request.getServerName() + ":" + request.getLocalPort() + request.getContextPath();
	}

	@Override
	public String getUrlName() {
		return "config";
	}

	public Object getDynamic(String token, StaplerRequest request, StaplerResponse response) {
		if (token.equals("manageStage")) { //delegate to manageStage
			return new ManageStageAction();
		}
		return this;
	}

	//get work stages by project id and sprint id
	//http://localhost:8080/ezScrum/plugin/taskBoard/config/getWorkStages?sprintID=sprintNumber
	public void doGetWorkStages(StaplerRequest req, StaplerResponse rsp) {
		init(req);
		mEzScrumURL = req.getServerName() + ":" + req.getLocalPort() + req.getContextPath();
		String sprintID = req.getParameter("sprintID");
		String workStages = "";
		String defaultWorkStages = "{\"stages\":[{\"id\": \"110\", \"name\": \"Story\"},{\"id\": \"120\", \"name\": \"Not Checked Out\"},{\"id\": \"130\", \"name\": \"Checked Out\"},{\"id\": \"140\", \"name\": \"Done\"}]}";
		//check null condition
		if (mProjectId == null || sprintID == null ||
		        mProjectId.isEmpty() || sprintID.isEmpty()) {
			try {
				rsp.getWriter().write("project id, sprint id cannot be null");
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}

		// get current sprint id, or next sprint id(not overdue)
		if (sprintID.equals("currentSprint")) {
			EzScrumWebServiceController ezScrumWebServiceController = new EzScrumWebServiceController(mEzScrumURL);

			String jsonString = ezScrumWebServiceController.getSprintInfoListString(mProjectId, mUserName, mEncodedPassword);
			sprintID = this.parseSprintInfoToGetCurrentSprintID(jsonString);
		}

		PluginConfigDAO pluginConfigDAO = new PluginConfigDAO();
		workStages = pluginConfigDAO.getWorkStages(mProjectId, sprintID);

		if (workStages == null) {//if there is not exited work stages return default value
			workStages = defaultWorkStages;
		}
		try {
			rsp.getWriter().write(workStages);
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}

	}

	//get sprint id list
	//http://localhost:8080/ezScrum/plugin/taskBoard/config/getSprintIDStringList
	public void doGetSprintIDStringList(StaplerRequest req, StaplerResponse rsp) {
		init(req);
		mEzScrumURL = req.getServerName() + ":" + req.getLocalPort() + req.getContextPath();
		EzScrumWebServiceController ezScrumWebServiceController = new EzScrumWebServiceController(mEzScrumURL);
		HttpSession session = req.getSession();

		if (mProjectId == null || mProjectId.isEmpty()) {
			try {
				rsp.getWriter().write("project id cannot be null");
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}

		String jsonString = ezScrumWebServiceController.getSprintInfoListString(mProjectId, mUserName, mEncodedPassword);

		String result = this.parseSprintInfoToGetSprintIDListString(jsonString);

		try {
			rsp.getWriter().write(result);
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}

	//check is current sprint
	//http://localhost:8080/ezScrum/plugin/taskBoard/config/checkIsSprintOverdue?sprintID=sprintNumber
	public void doCheckIsSprintOverdue(StaplerRequest req, StaplerResponse rsp) {
		init(req);
		mEzScrumURL = req.getServerName() + ":" + req.getLocalPort() + req.getContextPath();
		EzScrumWebServiceController ezScrumWebServiceController = new EzScrumWebServiceController(mEzScrumURL);

		String sprintID = req.getParameter("sprintID");
		if (mProjectId == null || sprintID == null ||
				mProjectId.isEmpty() || sprintID.isEmpty()) {
			try {
				rsp.getWriter().write("project id and sprint id cannot be null");
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}

		String jsonString = ezScrumWebServiceController.getSprintInfoListString(mProjectId, mUserName, mEncodedPassword);

		String result = this.parseSprintInfoToCheckIsSprintOverdue(jsonString, sprintID);

		try {
			rsp.getWriter().write(result);
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}

	// retrieve sprint id list from sprint info
	private String parseSprintInfoToGetSprintIDListString(String jsonString) {
		String result = "";

		JsonParser parser = new JsonParser();
		JsonObject o = (JsonObject) parser.parse(jsonString);

		JsonArray array = o.getAsJsonArray("sprintPlanList");

		if (array.size() == 0) {
			return "no sprint";
		}

		for (JsonElement jsonElement : array) {
			JsonObject jsonObject = jsonElement.getAsJsonObject().get("sprintPlan").getAsJsonObject();

			result = result + jsonObject.get("id").getAsInt() + ",";

		}

		result = result.substring(0, result.length() - 1);
		return result;
	}

	// retrieve "current" sprint id from sprint info
	private String parseSprintInfoToGetCurrentSprintID(String jsonString) {
		JsonParser parser = new JsonParser();
		JsonObject o = (JsonObject) parser.parse(jsonString);

		String currentSprintID = o.get("currentSprintID").getAsString();

		return currentSprintID;
	}

	// check the sprint is overdue or not
	private String parseSprintInfoToCheckIsSprintOverdue(String jsonString, String sprintID) {
		int sID = Integer.parseInt(sprintID);

		String result = "Sprint #" + sprintID + "doesn't exist";

		JsonParser parser = new JsonParser();
		JsonObject o = (JsonObject) parser.parse(jsonString);

		JsonArray array = o.getAsJsonArray("sprintPlanList");

		if (array.size() == 0) {
			return "no sprint";
		}

		for (JsonElement jsonElement : array) {
			JsonObject jsonObject = jsonElement.getAsJsonObject().get("sprintPlan").getAsJsonObject();

			if (jsonObject.get("id").getAsInt() == sID) {
				String startDateStr = jsonObject.get("startDate").getAsString();
				int interval = jsonObject.get("interval").getAsInt();
				try {
					SimpleDateFormat formatter = new SimpleDateFormat("yyyy/MM/dd");
					// start date
					Date startDate = formatter.parse(startDateStr);
					Calendar calendar = Calendar.getInstance();
					calendar.setTime(startDate);
					calendar.add(Calendar.WEEK_OF_YEAR, interval);
					calendar.add(Calendar.DAY_OF_YEAR, -1);
					// end date
					Date endDate = calendar.getTime();
					//now
					Date now = new Date();

					result = String.valueOf(now.after(endDate));
				} catch (ParseException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
				break;
			}
		}
		return result;
	}

}
