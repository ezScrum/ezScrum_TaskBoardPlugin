package plugin.taskBoard.DAO;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

import plugin.taskBoard.dataModel.TaskBoardConfig;

import ntut.csie.ezScrum.plugin.PluginExtensioner;

public class PluginConfigDAO {
	public  String createTableCommand = "CREATE TABLE IF NOT EXISTS configTable (projectID string, sprintID string, workStages string, PRIMARY KEY(projectID, sprintID) )";	
	private Connection _connection;
	private String _resource;

	public PluginConfigDAO(){
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
			_connection = DriverManager.getConnection("jdbc:sqlite:"+this._resource+"/taskBoard_config.db");
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
	
	
	public String getWorkStages( String projectID, String sprintID ){
		String workStages = null;
		String defaultWorkStages = "{\"stages\":[{\"id\": \"110\", \"name\": \"Story\"},{\"id\": \"120\", \"name\": \"Not Checked Out\"},{\"id\": \"130\", \"name\": \"Checked Out\"},{\"id\": \"140\", \"name\": \"Done\"}]}";
		
		this.openConnection();
	    try
	    {
	      Statement statement = _connection.createStatement();
	      statement.setQueryTimeout(30);  // set timeout to 30 sec.
	      
	      //create table if not exists such table
	      statement.executeUpdate( createTableCommand );
	      ResultSet rs = statement.executeQuery("SELECT workStages FROM configTable WHERE projectID = " + "'" + projectID +"' AND sprintID = '"+sprintID+"'");

	      if( rs.next() ){
	    	  workStages = rs.getString("workStages");
	      }else{
	    	  this.closeConnection();
	    	  TaskBoardConfig taskBoardConfig = new TaskBoardConfig(projectID, sprintID, defaultWorkStages);
	    	  this.insertConfig(taskBoardConfig);
	    	  workStages = defaultWorkStages;
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
		return workStages;
	}
	/**@
	 * 
	 * */
	public void insertConfig( TaskBoardConfig taskBoardConfig ){
		this.openConnection();
	    try
	    {
	      Statement statement = _connection.createStatement();
	      statement.setQueryTimeout(30);  // set timeout to 30 sec.
	    //create table if not exists such table
	      statement.executeUpdate( createTableCommand );
	      
	      statement.executeUpdate("INSERT INTO configTable VALUES("+"'"+taskBoardConfig.getProjectID()+"', '"+taskBoardConfig.getSprintID()+"', '"+taskBoardConfig.getWorkStages()+"')");
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
	
	public void updateWorkStages( TaskBoardConfig taskBoardConfig ){
		this.openConnection();
	    try
	    {
	      Statement statement = _connection.createStatement();
	      statement.setQueryTimeout(30);  // set timeout to 30 sec.
	      statement.executeUpdate("UPDATE configTable SET workStages = '"+taskBoardConfig.getWorkStages()+"' WHERE "+" projectID = '"+taskBoardConfig.getProjectID()+"' AND "+" sprintID = '"+taskBoardConfig.getSprintID() +"'");
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
	
	public void deleteConfig( TaskBoardConfig taskBoardConfig ){
		this.openConnection();
	    try
	    {
	      Statement statement = _connection.createStatement();
	      statement.setQueryTimeout(30);  // set timeout to 30 sec.
	      statement.executeUpdate("DELETE FROM configTable WHERE projectID = '"+taskBoardConfig.getProjectID()+"'" + "AND sprintID = '" + taskBoardConfig.getSprintID() + "' AND workStages = '" + taskBoardConfig.getWorkStages() +"'" );
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
}
