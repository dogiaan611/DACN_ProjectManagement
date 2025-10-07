using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class TaskTag
{
    [Key, Column(Order = 0)]
    public int TaskId { get; set; }
    public Task Task { get; set; }

    [Key, Column(Order = 1)]
    public int TagId { get; set; }
    public Tag Tag { get; set; }
}
