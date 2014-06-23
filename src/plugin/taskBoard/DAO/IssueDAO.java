package plugin.taskBoard.DAO;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;

import plugin.taskBoard.dataModel.IssueInformation;

import ntut.csie.ezScrum.plugin.PluginExtensioner;

public class IssueDAO {
	public  String createTableCommand = "CREATE TABLE IF NOT EXISTS issueTable (projectID string, sprintID string, issueID string, status string, healthReport string, PRIMARY KEY(projectID, sprintID, issueID) )";	
	private Connection _connection;
	private String _resource;

	public IssueDAO(){
		try {
			Class.forName("org.sqlite.JDBC");
		} catch (ClassNotFoundException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		PluginExtensioner pluginExtensioner = new PluginExtensioner("TaskBoardPlugin");
		_resource = pluginExtensioner.getPluginRoot()+"/resource";
		//_resource = "resource";
	}
	
	private void openConnection(){
		try {
			_connection = DriverManager.getConnection("jdbc:sqlite:"+this._resource+"/taskBoard_issue.db");
		} catch (SQLException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
	
	private void closeConnection(){
		try
	      {
	        if(_connection != null)
	          _connection.close();
	      }
	      catch(SQLException e)
	      {
	        // connection close failed.
	        System.err.println(e);
	      }
	}
	
	public void insertIssueInformation( IssueInformation issue ){
		this.openConnection();
	    try
	    {
	      Statement statement = _connection.createStatement();
	      statement.setQueryTimeout(30);  // set timeout to 30 sec.
	    //create table if not exists such table
	      statement.executeUpdate( createTableCommand );
	      
	      statement.executeUpdate("INSERT INTO issueTable VALUES("+"'"+issue.getProjectID()+
	    		  												"', '"+issue.getSprintID()+
	    		  												"', '"+issue.getIssueID()+
	    		  												"', '"+issue.getStatus()+
	    		  												"', '"+issue.getHealthReport()+"')");
	    }
	    catch(SQLException e)
	    {
	      // if the error message is "out of memory",
	      // it probably means no database file is found
	      System.err.println(e.getMessage());
	    }
	    finally
	    {
	      this.closeConnection();
	    }
	}
	
	public String getIssueSprintID( String projectID, String issueID ){
		String sprintID = "";
		
		this.openConnection();
	    try
	    {
	      Statement statement = _connection.createStatement();
	      statement.setQueryTimeout(30);  // set timeout to 30 sec.
	      
	      //create table if not exists such table
	      statement.executeUpdate( createTableCommand );
	      ResultSet rs = statement.executeQuery("SELECT sprintID FROM issueTable WHERE projectID = " + "'" + projectID +"' AND issueID = '"+issueID+"'");

	      while(rs.next())
	      {
	    	  sprintID = rs.getString("sprintID");
	      }
	    }
	    catch(SQLException e)
	    {
	      // if the error message is "out of memory",
	      // it probably means no database file is found
	      System.err.println(e.getMessage());
	    }
	    finally
	    {
	      this.closeConnection();
	    }
		return sprintID;
	}
	
	public void updateIssueSprintIDandStatus( IssueInformation issue ){
		this.openConnection();
	    try
	    {
	      Statement statement = _connection.createStatement();
	      statement.setQueryTimeout(30);  // set timeout to 30 sec.
	      statement.executeUpdate("UPDATE issueTable SET sprintID = '"+ issue.getSprintID() +"', status = '"+issue.getStatus()+"' WHERE projectID = '"+issue.getProjectID()+"' AND issueID = '"+issue.getIssueID()+"'");
	    }
	    catch(SQLException e)
	    {
	      // if the error message is "out of memory",
	      // it probably means no database file is found
	      System.err.println(e.getMessage());
	    }
	    finally
	    {
	      this.closeConnection();
	    }
	}
	
	public String getIssueStatus( IssueInformation issue ){
		String status = "";
		
		this.openConnection();
	    try
	    {
	      Statement statement = _connection.createStatement();
	      statement.setQueryTimeout(30);  // set timeout to 30 sec.
	      
	      //create table if not exists such table
	      statement.executeUpdate( createTableCommand );
	      ResultSet rs = statement.executeQuery("SELECT status, sprintID FROM issueTable WHERE projectID = " + "'" + issue.getProjectID() +"' AND issueID = '"+issue.getIssueID()+"'");

	      if( rs.next() ){
	    	  if( rs.getString("sprintID").equals(issue.getSprintID()) ){
	    		  // 如果從 ezScrum取回issue的狀態為 new 或 closed，表示
	    		  // 1. issue 在 plugin DB的狀態應為一樣
	    		  // 2. plugin 曾經被使用過所以有issue的資料, 但後來被暫停切換回ezScrum 的 Task Board使用並更改部分issue的狀態, 導至再重新啟用plugin時狀態不同步 
	    		  if( issue.getStatus().equals("new") || issue.getStatus().equals("closed") ){
	    			  this.closeConnection();
	    			  this.updateIssueSprintIDandStatus(issue);
	    			  status = issue.getStatus();
	    		  }// issue 為 assigned(中間狀態)
	    		  else if( issue.getStatus().equals("assigned") ){
	    			  // 如果 issue的plugin 狀態為 new 或 closed, 但使用者切換回ezScrum Task Board 將 issue 狀態改為 Checked Out(assigned), 再切換回plugin使用時, issue狀態應為 assigned 
	    			  if( rs.getString("status").equals("new") || rs.getString("status").equals("closed") ){
	    				  this.closeConnection();
		    			  this.updateIssueSprintIDandStatus(issue);
		    			  status = issue.getStatus();  
	    			  }// issue 在 ezScrum的狀態為assigned, 且在 plugin的狀態也為中間任一狀態
	    			  else{
	    				  status = rs.getString("status");
	    			  }
	    		  }
	    	  }else{
	    		  this.closeConnection();
	    		  // 如果資料已存在, 但sprint id不同, 表示 issue被drop過
	    		  this.updateIssueSprintIDandStatus(issue);
	    		  status = issue.getStatus();
	    	  }
	    	  
	      }else{
	    	  this.closeConnection();
	    	  this.insertIssueInformation( issue );
	    	  status = issue.getStatus();
	      }
	    }
	    catch(SQLException e)
	    {
	      // if the error message is "out of memory",
	      // it probably means no database file is found
	      System.err.println(e.getMessage());
	    }
	    finally
	    {
	      this.closeConnection();
	    }
		return status;
	}
	
	public void updateIssueStatus( IssueInformation issue ){
		this.openConnection();
	    try
	    {
	      Statement statement = _connection.createStatement();
	      statement.setQueryTimeout(30);  // set timeout to 30 sec.
	      statement.executeUpdate("UPDATE issueTable SET status = '"+issue.getStatus()+"' WHERE projectID = '"+issue.getProjectID()+"' AND sprintID = '"+issue.getSprintID() +"' AND issueID = '"+issue.getIssueID()+"'");
	      System.out.println("UPDATE issueTable SET status = '"+issue.getStatus()+"' WHERE projectID = '"+issue.getProjectID()+"' AND sprintID = '"+issue.getSprintID() +"' AND issueID = '"+issue.getIssueID()+"'");
	    }
	    catch(SQLException e)
	    {
	      // if the error message is "out of memory",
	      // it probably means no database file is found
	      System.err.println(e.getMessage());
	    }
	    finally
	    {
	      this.closeConnection();
	    }
	}
	
	public String getIssueHealthReport( String projectID, String sprintID, String issueID ){
		String healthReport = null;
		
		this.openConnection();
	    try
	    {
	      Statement statement = _connection.createStatement();
	      statement.setQueryTimeout(30);  // set timeout to 30 sec.
	      
	      //create table if not exists such table
	      statement.executeUpdate( createTableCommand );
	      ResultSet rs = statement.executeQuery("SELECT healthReport FROM issueTable WHERE projectID = " + "'" + projectID +"' AND sprintID = '"+sprintID+"' AND issueID = '"+issueID+"'");

	      while(rs.next())
	      {
	    	  healthReport = rs.getString("healthReport");
	      }
	    }
	    catch(SQLException e)
	    {
	      // if the error message is "out of memory",
	      // it probably means no database file is found
	      System.err.println(e.getMessage());
	    }
	    finally
	    {
	      this.closeConnection();
	    }
	    
		return healthReport;
	}
	
	public void updateIssueHealthReport( IssueInformation issue ){
		this.openConnection();
	    try
	    {
	      Statement statement = _connection.createStatement();
	      statement.setQueryTimeout(30);  // set timeout to 30 sec.
	      statement.executeUpdate("UPDATE issueTable SET healthReport = '"+issue.getHealthReport()+"' WHERE projectID = '"+issue.getProjectID()+"' AND sprintID = '"+issue.getSprintID() +"' AND issueID = '"+issue.getIssueID()+"'");
	    }
	    catch(SQLException e)
	    {
	      // if the error message is "out of memory",
	      // it probably means no database file is found
	      System.err.println(e.getMessage());
	    }
	    finally
	    {
	      this.closeConnection();
	    }
	}

	public ArrayList<String> getStageIssue( String projectID, String sprintID, String status ){
		ArrayList<String> issueList = new ArrayList<String>();
		this.openConnection();
	    try
	    {
	      Statement statement = _connection.createStatement();
	      statement.setQueryTimeout(30);  // set timeout to 30 sec.
	      
	      //create table if not exists such table
	      statement.executeUpdate( createTableCommand );
	      ResultSet rs = statement.executeQuery("SELECT issueID FROM issueTable WHERE projectID = '"+ projectID +"'  AND sprintID = '"+ sprintID +"' AND status = '"+ status +"'");
	      
	      while(rs.next())
	      {
	    	  issueList.add( rs.getString("issueID") );
	      }
	    }
	    catch(SQLException e)
	    {
	      // if the error message is "out of memory",
	      // it probably means no database file is found
	      System.err.println(e.getMessage());
	    }
	    finally
	    {
	      this.closeConnection();
	    }
		return issueList;
	}
	
	/*public void deleteConfig( TaskBoardConfig taskBoardConfig ){
		this.openConnection();
	    try
	    {
	      Statement statement = _connection.createStatement();
	      statement.setQueryTimeout(30);  // set timeout to 30 sec.
	      statement.executeUpdate("DELETE FROM issueTable WHERE projectID = '"+taskBoardConfig.getProjectID()+"'" + "AND sprintID = '" + taskBoardConfig.getSprintID() + "' AND workStages = '" + taskBoardConfig.getWorkStages() +"'" );
	    }
	    catch(SQLException e)
	    {
	      // if the error message is "out of memory",
	      // it probably means no database file is found
	      System.err.println(e.getMessage());
	    }
	    finally
	    {
	      this.closeConnection();
	    }
	}*/
}
