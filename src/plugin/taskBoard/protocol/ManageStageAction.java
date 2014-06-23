package plugin.taskBoard.protocol;

import java.io.IOException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;

import javax.servlet.http.HttpSession;

import ntut.csie.ezScrum.web.form.ProjectInfoForm;
import ntut.csie.ezScrum.web.internal.IProjectSummaryEnum;

import org.codehaus.jettison.json.JSONObject;
import org.codehaus.jettison.json.JSONWriter;
import org.kohsuke.stapler.StaplerRequest;
import org.kohsuke.stapler.StaplerResponse;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

 
import plugin.taskBoard.DAO.IssueDAO;
import plugin.taskBoard.DAO.PluginConfigDAO;
import plugin.taskBoard.dataModel.IssueInformation;
import plugin.taskBoard.dataModel.TaskBoardConfig;
import plugin.taskBoard.webservice.EzScrumWebServiceController;

/*
 * 因為無法預測使用者會對 work stage 進行怎樣一連串的操作,
 * 每個 work stage 底下可能有對應的 issue, 所以不適合在 前端等所有操作完畢才更新資料, 會大亂,
 * 所以限制使用者每對 stage 操作一次就進行資料的 update
 * 
 * note: 未來可考慮換成用 Gson 解析、打包, 可讀性會高很多... 還有些 magic value 是 depend on data、 bed smell 都可再優化
 * 
 */

public class ManageStageAction extends ConfigAction{
	
	// add new stage 
	// http://localhost:8080/ezScrum/plugin/taskBoard/config/manageStage/addWorkStage
	// note: gson.json中, 將poperty的value轉為字串要用 getAsString(), 將整個 object/array 轉為字串要用 toString() 才不會 exception
	public void doAddWorkStage(StaplerRequest req, StaplerResponse rsp){
    	HttpSession session = req.getSession();
    	ProjectInfoForm projectInfoForm = (ProjectInfoForm)session.getAttribute( IProjectSummaryEnum.PROJECT_INFO_FORM );
    	
    	String projectID = projectInfoForm.getName();
		String sprintID   = req.getParameter("sprintID");
		String name   = req.getParameter("name");
		String description   = req.getParameter("description");
		String wip   = req.getParameter("wip");
		
		//check null condition
		if( projectID == null || sprintID == null || name == null || wip == null ||
			projectID.isEmpty() || sprintID.isEmpty() || name.isEmpty() || wip.isEmpty() ) {
			try {
				rsp.getWriter().write("project id, sprint id, stage name cannot be null");
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}
		
		// config DAO to get work stages 
		PluginConfigDAO pluginConfigDAO = new PluginConfigDAO();
		String workStages = pluginConfigDAO.getWorkStages( projectID, sprintID );

		// add new work stage into the workflow(all work stages)
		String newWorkStagesJsonString = addWorkStageIntoJsonArray( workStages, name, description, wip );
		
		// config DAO to update work stages
		TaskBoardConfig config = new TaskBoardConfig( projectID, sprintID, newWorkStagesJsonString );
		pluginConfigDAO.updateWorkStages( config );
	}
	
	// add new stage into the work stages json object in sqlite
	private String addWorkStageIntoJsonArray( String workStages, String name, String description, String wip ){
		String result = "";
		
		JsonParser parser = new JsonParser();
		JsonObject o = (JsonObject)parser.parse(workStages);
		JsonArray stageArray = o.getAsJsonArray("stages");

		JsonObject newWorkStages = new JsonObject();
		JsonArray newStageArray = new JsonArray();
		for( JsonElement e : stageArray ){
			JsonObject stage = e.getAsJsonObject();
			String stageName = stage.get("name").getAsString();

			// 將新的 stage 放置 Done 之前
			if( stageName.equals( "Done" ) ){
				String doneStageID = stage.get("id").getAsString();
				
				// 新 stage 的 id, 包好後塞到 Json array裡
				int newStageID = Integer.parseInt(doneStageID);
				JsonObject newStageObject = convertStageInfoToJsonObject( String.valueOf( newStageID ), name, description, wip, null );
				newStageArray.add( newStageObject );

				// 調整 Done stage 的 id
				int newDoneStageID = Integer.parseInt(doneStageID) + 10;
				// update done stage
				stage.remove("id");
				stage.addProperty("id", String.valueOf( newDoneStageID ) );
			}
			// 重新將 stage 包成 json
			newStageArray.add( stage );
		}
		
		newWorkStages.add("stages", newStageArray);
		result = newWorkStages.toString();
		return result;
	}
	
	
	// add new  "subStage" 
	// http://localhost:8080/ezScrum/plugin/taskBoard/config/manageStage/addWorkSubStage
	public void doAddWorkSubStage(StaplerRequest req, StaplerResponse rsp){
		HttpSession session = req.getSession();
		ProjectInfoForm projectInfoForm = (ProjectInfoForm)session.getAttribute( IProjectSummaryEnum.PROJECT_INFO_FORM );
		
		String projectID = projectInfoForm.getName();
		String sprintID   = req.getParameter("sprintID");
		String parentID   = req.getParameter("parentID");
		String name   = req.getParameter("name");
		String description   = req.getParameter("description");
		String wip   = req.getParameter("wip");
		
		//check null condition
		if( projectID == null || sprintID == null || parentID == null || name == null || wip == null ||
			projectID.isEmpty() || sprintID.isEmpty() || parentID.isEmpty() || name.isEmpty() || wip.isEmpty() ) {
			try {
				rsp.getWriter().write("project id, sprint id, parent stage id, stage name cannot be null");
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}
		
		// config DAO to get work stages 
		PluginConfigDAO pluginConfigDAO = new PluginConfigDAO();
		String workStages = pluginConfigDAO.getWorkStages( projectID, sprintID );

		// add new work stage into the workflow(all work stages)
		String newWorkStagesJsonString = addWorkSubStageIntoJsonArray( workStages, parentID, name, description, wip );
		
		// 如果子階段數量超過, 不給更新
		if( newWorkStagesJsonString.equals( "subStage length limit is 9." ) ){
			try {
				rsp.getWriter().write( newWorkStagesJsonString );
			} catch (IOException e) {
				e.printStackTrace();
			}
		}else{
			// config DAO to update work stages
			TaskBoardConfig config = new TaskBoardConfig( projectID, sprintID, newWorkStagesJsonString );
			pluginConfigDAO.updateWorkStages( config );
		}
	}
	
	// add new "subStage" into the work stages json object in sqlite
	private String addWorkSubStageIntoJsonArray( String workStages, String parentID, String name, String description, String wip ){
		String result = "";
		
		JsonParser parser = new JsonParser();
		JsonObject o = (JsonObject)parser.parse(workStages);
		JsonArray stageArray = o.getAsJsonArray("stages");

		JsonObject newWorkStages = new JsonObject();
		JsonArray newStageArray = new JsonArray();
		for( JsonElement e : stageArray ){
			JsonObject stage = e.getAsJsonObject();
			String stageID = stage.get("id").getAsString();
			
			// 將新的 stage 放置 subStage的最後面
			if( stageID.equals( parentID ) ){
				JsonArray subStageArray = stage.getAsJsonArray("subStage");
				
				// construct subStage array if there is no subStage belong to this stage 
				if( subStageArray == null ){
					JsonObject newStage = new JsonObject();
					String newStageName = stage.get("name").getAsString();
					String newStageDescription = stage.get("description") == null ? null : stage.get("description").getAsString();
					
					newStage = convertStageInfoToJsonObject( stageID, newStageName, newStageDescription, "0", null );
					
					// set subStage id
					int subStageID = Integer.parseInt(stageID) + 1;// subStage 看個位數  , 130{131, 132}
					// set subStage array
					JsonArray newSubStageArray = new JsonArray();
					JsonObject newSubStage = convertStageInfoToJsonObject( String.valueOf( subStageID ), name, description, wip, null );
					newSubStageArray.add( newSubStage );
					newStage.add("subStage", newSubStageArray);
					newStageArray.add( newStage );
					continue;
				}else{
					// set subStage id
					int subStageAmount = subStageArray.size();
					int subStageID = Integer.parseInt(stageID) + subStageAmount + 1;
					if( subStageID % 10 > 9 ){
						result = "subStage length limit is 9.";
						return result;
					}
					// set subStage into array
					JsonObject newSubStage= convertStageInfoToJsonObject( String.valueOf( subStageID ), name, description, wip, null );
					subStageArray.add( newSubStage );
				}
			}
			// 重新將 stage 包成 json
			newStageArray.add( stage );
		}
		
		newWorkStages.add("stages", newStageArray);
		result = newWorkStages.toString();
		return result;
	}
	
	
	// edit stage or subStage 
	// http://localhost:8080/ezScrum/plugin/taskBoard/config/manageStage/editWorkStage
	public void doEditWorkStage(StaplerRequest req, StaplerResponse rsp){
		HttpSession session = req.getSession();
		ProjectInfoForm projectInfoForm = (ProjectInfoForm)session.getAttribute( IProjectSummaryEnum.PROJECT_INFO_FORM );
		
		String projectID = projectInfoForm.getName();
		String sprintID   = req.getParameter("sprintID");
		String id   = req.getParameter("id");
		String name   = req.getParameter("name");
		String description   = req.getParameter("description");
		String wip   = req.getParameter("wip");
		
		//check null condition
		if( projectID == null || sprintID == null || id == null || name == null || wip == null ||
			projectID.isEmpty() || sprintID.isEmpty() || id.isEmpty() || name.isEmpty() || wip.isEmpty() ) {
			try {
				rsp.getWriter().write("projectID, sprintID, id, name, wip cannot be null");
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}
		
		// config DAO to get work stages 
		PluginConfigDAO pluginConfigDAO = new PluginConfigDAO();
		String workStages = pluginConfigDAO.getWorkStages( projectID, sprintID );

		// edit work stage into the workflow(all work stages)
		String newWorkStagesJsonString = editWorkStageIntoJsonArray( workStages, id, name, description, wip );
		
		// config DAO to update work stages
		TaskBoardConfig config = new TaskBoardConfig( projectID, sprintID, newWorkStagesJsonString );
		pluginConfigDAO.updateWorkStages( config );
		
	}
	
	// edit stage/subStage info, into the work stages json object in sqlite
	private String editWorkStageIntoJsonArray( String workStages, String id, String name, String description, String wip ){
		String result = "";
		
		String levelOneStageID = id.substring( 0, 2 ) + "0";
		String levelTwoStageID = id.substring( 2 ).equals("0") ? "none" : id;
		
		JsonParser parser = new JsonParser();
		JsonObject o = (JsonObject)parser.parse(workStages);
		JsonArray stageArray = o.getAsJsonArray("stages");

		JsonObject newWorkStages = new JsonObject();
		JsonArray newStageArray = new JsonArray();
		for( JsonElement e : stageArray ){
			JsonObject stage = e.getAsJsonObject();
			
			String stageID = stage.get("id").getAsString();
			if( stageID.equals( levelOneStageID ) ){
				JsonArray subStageArray = stage.getAsJsonArray("subStage");
				if( id.equals( levelOneStageID ) ){
					JsonObject editStage = new JsonObject();
					if( subStageArray != null && subStageArray.size() > 0 ) {
						editStage = convertStageInfoToJsonObject( id, name, description, wip, subStageArray );
					}else{
						editStage = convertStageInfoToJsonObject( id, name, description, wip, null );
					}
					newStageArray.add( editStage );
					continue;
				}else if( id.equals( levelTwoStageID ) ){
					stage.remove("subStage");
					
					JsonArray newSubStageArray = new JsonArray();
					
					for( JsonElement s : subStageArray ){
						JsonObject subStage = s.getAsJsonObject();
						
						if( subStage.get("id").getAsString().equals( levelTwoStageID ) ){
							JsonObject newSubStage = convertStageInfoToJsonObject( id, name, description, wip, null);
							newSubStageArray.add( newSubStage );
							continue;
						}
						newSubStageArray.add( subStage );
					}
					stage.add( "subStage", newSubStageArray);
					newStageArray.add( stage );
					continue;
				}
			}
			
			// 重新將 stage 包成 json
			newStageArray.add( stage );
		}
		
		newWorkStages.add("stages", newStageArray);
		result = newWorkStages.toString();
		return result;
	}
	

	// delete stage or subStage 
	// http://localhost:8080/ezScrum/plugin/taskBoard/config/manageStage/deleteWorkStage
	public void doDeleteWorkStage(StaplerRequest req, StaplerResponse rsp){
		HttpSession session = req.getSession();
		ProjectInfoForm projectInfoForm = (ProjectInfoForm)session.getAttribute( IProjectSummaryEnum.PROJECT_INFO_FORM );
		
		String projectID = projectInfoForm.getName();
		String sprintID   = req.getParameter("sprintID");
		String id   = req.getParameter("id");
		
		//check null condition
		if( projectID == null || sprintID == null || id == null || 
			projectID.isEmpty() || sprintID.isEmpty() || id.isEmpty() ) {
			try {
				rsp.getWriter().write("projectID, sprintID, issueID, status cannot be null");
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}
		
		// config DAO to get work stages 
		PluginConfigDAO pluginConfigDAO = new PluginConfigDAO();
		String workStages = pluginConfigDAO.getWorkStages( projectID, sprintID );

		// delete work stage into the workflow(all work stages)
		String newWorkStagesJsonString = deleteWorkStageIntoJsonArray( projectID, sprintID, workStages, id );
		
		// config DAO to update work stages
		TaskBoardConfig config = new TaskBoardConfig( projectID, sprintID, newWorkStagesJsonString );
		pluginConfigDAO.updateWorkStages( config );
		
	}
	
	// edit stage/subStage info, into the work stages json object in sqlite
	private String deleteWorkStageIntoJsonArray( String projectID, String sprintID, String workStages, String id ){
		String result = "";
		
		// 第一層 stage id
		String levelOneStageID = id.substring( 0, 2 ) + "0";
		// 第二層 stage id, 若delete目標為第一層則給 none 
		String levelTwoStageID = id.substring( 2 ).equals("0") ? "none" : id;
		
		JsonParser parser = new JsonParser();
		JsonObject o = (JsonObject)parser.parse(workStages);
		JsonArray stageArray = o.getAsJsonArray("stages"); // root

		JsonObject newWorkStages = new JsonObject(); // 新的 workStages Json object
		JsonArray newStageArray = new JsonArray(); // 新的 stage array
		boolean deleteSuccess = false; // 用以update 被 delete 掉的 stage, 其後面 stage 的狀態也要更新
		String deleteStageLevel = "";
		
		for( JsonElement e : stageArray )
		{
			JsonObject stage = e.getAsJsonObject();
			
			// 依 id 找 stage
			String stageID = stage.get("id").getAsString();
			if( stageID.equals( levelOneStageID ) )
			{
				// subStage
				JsonArray subStageArray = stage.getAsJsonArray("subStage");
				
				// 操作的 stage 剛好是第一層, 不將此 stage 加到 array裡, 更新相關的 issue
				if( id.equals( levelOneStageID ) )
				{
					// 如果有 subStage 的話, 代表可能有 issue 在此 subStage 底下, 所以將 issue 的狀態進行 update
					// note: stage 如果有 subStage, 那 issue 只會依附在 subStage 下, issue 儲存的狀態為 subStage
					if( subStageArray != null && subStageArray.size() > 0 ) 
					{
						for( JsonElement s : subStageArray ){
							JsonObject subStage = s.getAsJsonObject();
							String subStageID = subStage.get("id").getAsString();
							this.updateStageIssue( projectID, sprintID, subStageID, "new" );
						}
					}
					else{ // 沒有 subStage, 就單純更新底下 issue 的狀態
						this.updateStageIssue( projectID, sprintID, stageID, "new" );
					}
					deleteSuccess = true;
					deleteStageLevel = "1";
					
				}// 操作的 stage 是第二層(subStage)
				else if( id.equals( levelTwoStageID ) ){
					stage.remove("subStage");// 移除 subStage
					
					JsonArray newSubStageArray = new JsonArray();// 新的 subStage
					
					for( JsonElement s : subStageArray ){
						JsonObject subStage = s.getAsJsonObject();
						String subStageID = subStage.get("id").getAsString();
						// 不將 subStage 加入array中, 且更新 issue 狀態
						if( subStageID.equals( levelTwoStageID ) ){
							this.updateStageIssue(projectID, sprintID, subStageID, "new");
							deleteSuccess = true;
							continue;
						}
						if( deleteSuccess ){
							int newID = Integer.parseInt( subStageID ) - 1;
							String newSubStageID = String.valueOf( newID );
							// 更新底下 issue 的狀態
							this.updateStageIssue(projectID, sprintID, subStageID, newSubStageID );
							// 更新 id
							subStage.remove( "id" );
							subStage.addProperty( "id", newSubStageID );
						}
						
						newSubStageArray.add( subStage );
					}
					stage.add( "subStage", newSubStageArray);
					newStageArray.add( stage );
					
					deleteStageLevel = "2";
				}
			}else{
				// 如果delete已經成功, 後面的 stage 都要往前移一格
				if( deleteSuccess && deleteStageLevel.equals( "1" )){
					// update stage id
					int newStageID = Integer.parseInt( stageID ) - 10;
					stage.remove("id");
					stage.addProperty( "id", String.valueOf( newStageID ));

					// subStage
					JsonArray subStageArray = stage.getAsJsonArray("subStage");
					
					if( subStageArray != null && subStageArray.size() > 0 ){
						// update subStage
						JsonArray newSubStageArray = updateSubStageID( projectID, sprintID, subStageArray, -10 );
						stage.remove("subStage");
						stage.add( "subStage", newSubStageArray );
					}
					else{ // 沒有 subStage, 就單純更新底下 issue 的狀態
						this.updateStageIssue( projectID, sprintID, stageID, String.valueOf( newStageID ) );
					}
				}
					
				// 重新將 stage 包成 json
				newStageArray.add( stage );
			}
		}
		
		newWorkStages.add("stages", newStageArray);
		result = newWorkStages.toString();
		return result;
	}
	
	// move stage or subStage 
	// http://localhost:8080/ezScrum/plugin/taskBoard/config/manageStage/dragDropWorkStage
	public void doDragDropWorkStage(StaplerRequest req, StaplerResponse rsp){
		HttpSession session = req.getSession();
		ProjectInfoForm projectInfoForm = (ProjectInfoForm)session.getAttribute( IProjectSummaryEnum.PROJECT_INFO_FORM );
		
		String projectID = projectInfoForm.getName();
		String sprintID   = req.getParameter("sprintID");
		String ddLevel   = req.getParameter("ddLevel");
		String oriID   = req.getParameter("oriID");
		String tarID   = req.getParameter("tarID");
		
		//check null condition
		if( projectID == null || sprintID == null || ddLevel == null || oriID == null || tarID == null || 
			projectID.isEmpty() || sprintID.isEmpty() || ddLevel.isEmpty() || oriID.isEmpty() || tarID.isEmpty() ) {
			try {
				rsp.getWriter().write("projectID, sprintID, ddLevel, oriID and tarID cannot be null");
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}
		
		// config DAO to get work stages 
		PluginConfigDAO pluginConfigDAO = new PluginConfigDAO();
		String workStages = pluginConfigDAO.getWorkStages( projectID, sprintID );

		// delete work stage into the workflow(all work stages)
		String newWorkStagesJsonString = dragDropWorkStageIntoJsonArray( projectID, sprintID, workStages, ddLevel, oriID, tarID );
		
		// config DAO to update work stages
		TaskBoardConfig config = new TaskBoardConfig( projectID, sprintID, newWorkStagesJsonString );
		pluginConfigDAO.updateWorkStages( config );
		
	}
	
	private final String LEVEL_ONE = "1";
	private final String LEVEL_TWO = "2";
	
	private String dragDropWorkStageIntoJsonArray(String projectID,	String sprintID, 
			String workStages, String ddLevel, String oriID, String tarID) 
	{
		String result = "";
		
		JsonParser parser = new JsonParser();
		JsonObject o = (JsonObject)parser.parse(workStages);
		JsonArray stageArray = o.getAsJsonArray("stages"); // root

		JsonObject newWorkStages = new JsonObject(); // 新的 workStages Json object
		JsonArray newStageArray = new JsonArray(); // 新的 stage array
		
		if( ddLevel.equals( LEVEL_ONE ) ){
			// get ori/tar stage index
			int oriStageIndex = ((Integer.valueOf( oriID ) - 100) / 10) -1;
			int tarStageIndex = ((Integer.valueOf( tarID ) - 100) / 10) -1;
			
			// get ori stage object
			JsonObject oriStage = cloneStage( stageArray.get( oriStageIndex ).getAsJsonObject() ); 
			
			boolean startToMove = false;

			// stage 往前移動
			if( tarStageIndex < oriStageIndex )
			{
				for( JsonElement e: stageArray )
				{
					JsonObject stage = e.getAsJsonObject();
					String stageID = stage.get("id").getAsString();
					
					// 此 stage 要往前移動, 所以跳過
					if( stageID.equals( oriID )){
						startToMove = false; // ori stage 後的 stage 不須變動
						continue;
					}
					
					// 找到 tar stage, 將 ori stage 塞在其之前
					if( stageID.equals( tarID )){
						oriStage.remove( "id" );
						oriStage.addProperty( "id", tarID); // change id
						
						// subStage
						JsonArray subStageArray = oriStage.getAsJsonArray("subStage");
						
						// 如果有 subStage, 更新 subStage的id 成temp id, 及底下的 issue
						if( subStageArray != null && subStageArray.size() > 0 ) {
							// update subStage
							JsonArray newSubStageArray = updateSubStageID( projectID, sprintID, subStageArray, (tarStageIndex - oriStageIndex) * 10 );
							oriStage.remove("subStage");
							oriStage.add( "subStage", newSubStageArray );
						}
						else{// 沒 subStage, 更新此 stage 底下的 issue
							updateStageIssue( projectID, sprintID, oriID, tarID );
						}
						
						newStageArray.add( oriStage );
						startToMove = true;
					}
					// 把中間 stage 往後移
					if( startToMove ){
						int newStageID = Integer.valueOf( stageID ) +10;
						stage.remove( "id" );
						stage.addProperty( "id", String.valueOf( newStageID )); // change id
						
						// subStage
						JsonArray subStageArray = stage.getAsJsonArray("subStage");
						
						// 如果有 subStage, 更新 subStage的id, 及底下的 issue
						if( subStageArray != null && subStageArray.size() > 0 ) {
							// update subStage
							JsonArray newSubStageArray = updateSubStageID( projectID, sprintID, subStageArray, +10 );
							stage.remove("subStage");
							stage.add( "subStage", newSubStageArray );
						}
						else{// 沒 subStage, 更新此 stage 底下的 issue
							updateStageIssue( projectID, sprintID, stageID, String.valueOf(newStageID) );
						}
					}
					newStageArray.add( stage );
				}
				
			}// stage 往後移動
			else if( tarStageIndex > oriStageIndex ){
				for( JsonElement e: stageArray )
				{
					JsonObject stage = e.getAsJsonObject();
					String stageID = stage.get("id").getAsString();
					
					// 此 stage 要往後移動, 所以跳過
					if( stageID.equals( oriID )){
						startToMove = true;
						continue;
					}
					
					// 把中間stage往前移
					if( startToMove ){
						int newStageID = Integer.valueOf( stageID ) -10;
						stage.remove( "id" );
						stage.addProperty( "id", String.valueOf( newStageID )); // change id
						
						// subStage
						JsonArray subStageArray = stage.getAsJsonArray("subStage");
						
						// 如果有 subStage, 更新 subStage的id, 及底下的 issue
						if( subStageArray != null && subStageArray.size() > 0 ) {
							// update subStage
							JsonArray newSubStageArray = updateSubStageID( projectID, sprintID, subStageArray, -10 );
							stage.remove("subStage");
							stage.add( "subStage", newSubStageArray );
						}
						else{// 沒 subStage, 更新此 stage 底下的 issue
							updateStageIssue( projectID, sprintID, stageID, String.valueOf(newStageID) );
						}
					}
					
					// 找到 tar stage, 將 ori stage 塞在其之後
					if( stageID.equals( tarID )){
						// 先加入經過 startToMove的tar stage 
						newStageArray.add( stage );
						
						oriStage.remove( "id" );
						oriStage.addProperty( "id", tarID); // change id
						
						// subStage
						JsonArray subStageArray = oriStage.getAsJsonArray("subStage");
						
						// 如果有 subStage, 更新 subStage的id, 及底下的 issue
						if( subStageArray != null && subStageArray.size() > 0 ) {
							// update subStage
							JsonArray newSubStageArray = updateSubStageID( projectID, sprintID, subStageArray, ( tarStageIndex - oriStageIndex ) * 10 );
							oriStage.remove("subStage");
							oriStage.add( "subStage", newSubStageArray );
						}
						else{// 沒 subStage, 更新此 stage 底下的 issue
							updateStageIssue( projectID, sprintID, oriID, tarID );
						}
						
						newStageArray.add( oriStage );
						startToMove = false;
						continue;
					}
					
					newStageArray.add( stage );
				}
			}
		}// 如果拖拉只移動 subStage
		else if( ddLevel.equals( LEVEL_TWO ) ){
			String parentID = oriID.substring( 0, 2 ) + "0";
			
			// get ori/tar stage index
			int oriStageIndex = (Integer.valueOf( oriID ) % 10) -1;
			int tarStageIndex = (Integer.valueOf( tarID ) % 10) -1;
			
			boolean startToMove = false;
			
			for( JsonElement e: stageArray ){
				JsonObject stage = e.getAsJsonObject();
				String stageID = stage.get("id").getAsString();
				
				// 找到第一層 stage
				if( stageID.equals( parentID ) ) {
					JsonArray newSubStageArray = new JsonArray();
					// subStage
					JsonArray subStageArray = stage.getAsJsonArray("subStage");
					// get ori stage object
					JsonObject oriSubStage = cloneStage( subStageArray.get( oriStageIndex ).getAsJsonObject() );

					// subStage 往前移動
					if( tarStageIndex < oriStageIndex )
					{
						
						for( JsonElement s : subStageArray )
						{
							JsonObject subStage = s.getAsJsonObject();
							String subStageID = subStage.get("id").getAsString();
							
							// 原本stage之後的stage不須更動
							if( subStageID.equals( oriID ) ){
								startToMove = false;
								continue;
							}
							
							// 把 ori stage 移到 tar stage 之前
							if( subStageID.equals( tarID ) ){
								// update id
								oriSubStage.remove( "id" );
								oriSubStage.addProperty( "id", tarID);
								// update issue
								updateStageIssue( projectID, sprintID, oriID, tarID );
								newSubStageArray.add( oriSubStage );
								startToMove = true;
							}
							
							// 將中間的 stage 往後移動
							if( startToMove ){
								// update id
								int newStageID = Integer.valueOf( subStageID ) +1;
								subStage.remove( "id" );
								subStage.addProperty( "id", String.valueOf( newStageID )); // change id
								// update issue
								updateStageIssue( projectID, sprintID, subStageID, String.valueOf( newStageID ) );
							}
							
							newSubStageArray.add( subStage );
						}
						
					}
					// subStage 往後移動
					else if( oriStageIndex < tarStageIndex )
					{
						for( JsonElement s : subStageArray )
						{
							JsonObject subStage = s.getAsJsonObject();
							String subStageID = subStage.get("id").getAsString();
							
							// 原本stage之後的stage開始變動
							if( subStageID.equals( oriID ) ){
								startToMove = true;
								continue;
							}

							// 將中間的 stage 往前移動
							if( startToMove ){
								// update id
								int newStageID = Integer.valueOf( subStageID ) -1;
								subStage.remove( "id" );
								subStage.addProperty( "id", String.valueOf( newStageID )); // change id
								// update issue
								updateStageIssue( projectID, sprintID, subStageID, String.valueOf( newStageID ) );
							}
							
							// 把 ori stage 移到 tar stage 之後
							if( subStageID.equals( tarID ) ){
								// 先加入 tar stage
								newSubStageArray.add( subStage );
								
								// update id
								oriSubStage.remove( "id" );
								oriSubStage.addProperty( "id", tarID );
								// update issue
								updateStageIssue( projectID, sprintID, oriID, tarID );
								newSubStageArray.add( oriSubStage );
								startToMove = false;
								continue;
							}
							
							newSubStageArray.add( subStage );
						}
					}
					
					// update subStage
					stage.remove("subStage");
					stage.add( "subStage", newSubStageArray );
				}
				
				newStageArray.add( stage );
			}
		}
		
		newWorkStages.add("stages", newStageArray);
		result = newWorkStages.toString();
		return result;
	}
	
	// update the subStage id which is belong to changed stage
	private JsonArray updateSubStageID( String projectID, String sprintID, JsonArray subStageArray, int updateValue ){
		JsonArray newSubStageArray = new JsonArray();
		
		for( JsonElement s : subStageArray ){
			JsonObject subStage = s.getAsJsonObject();
			String subStageID = subStage.get("id").getAsString();
			// new id
			int newID = Integer.parseInt( subStageID ) + updateValue;
			String newSubStageID = String.valueOf( newID );
			// update issue stage
			this.updateStageIssue( projectID, sprintID, subStageID, newSubStageID );
			// 更新 stage id, 加回 array
			subStage.remove( "id" );
			subStage.addProperty( "id", newSubStageID );
			newSubStageArray.add( subStage );
		}
		
		return newSubStageArray;
	}
	
	private JsonObject cloneStage( JsonObject stage ){
		String id = stage.get("id").getAsString();
		String name = stage.get("name").getAsString();
		String description = stage.get("description") == null ? null : stage.get("description").getAsString();
		String wip = stage.get("wip") == null ? null : stage.get("wip").getAsString();
		JsonArray subStages = stage.getAsJsonArray("subStage") == null ? null : stage.getAsJsonArray("subStage");
		
		return convertStageInfoToJsonObject( id, name, description, wip, subStages );
	}

	// package stage information into Json object
	private JsonObject convertStageInfoToJsonObject( String id, String name, String description, String wip, JsonArray subStages ){
		JsonObject stage = new JsonObject();
		
		stage.addProperty( "id", id );
		stage.addProperty( "name", name );
		
		if( description != null ){
			stage.addProperty( "description", description );
		}
		
		if( wip != null && !(wip.equals("0")) ){
			stage.addProperty( "wip", wip );
		}
		
		if( subStages != null ){
			stage.add( "subStage", subStages );
		}
		
		return stage;
	}

	// update the issues belong to stage
	private void updateStageIssue( String projectID, String sprintID, String stageID, String newStageID ){
		// 取得此狀態底下的 issue list
		IssueDAO issueDAO = new IssueDAO();
		ArrayList<String>issueList = issueDAO.getStageIssue(projectID, sprintID, stageID);
		
		for( String issueID : issueList ){
			IssueInformation issue = new IssueInformation(projectID, sprintID, issueID, newStageID, "" );
			issueDAO.updateIssueStatus( issue );
		}
	}
}
