/**********************************************************************
 *  README.txt
 *  CS5310  - Matrix transformations
 **********************************************************************/

/**********************************************************************
* What is your name?
***********************************************************************/

Ye Cao


/**********************************************************************
* What browser and operating system did you test your program with?
***********************************************************************/

Chrome, Mac OS

/**********************************************************************
* Answer any questions here that you were asked to answer on the 
* assignment's web page.
***********************************************************************/

1.  Is there a difference between multiplying the rotation matrix before 
the translation matrix and vice versa?
There is a difference. If we multiply rotation matrix before translation
matrix, the object will translate along the modified axis after rotation,
rather than the original x,y,z axis.

2.Discuss why you think it's different and what other approaches to 
solving the problem you can think of.
 When we comment out Three.DoubleSide, Three.JS applies the material 
 to the front (outside) of the object by defalut. However, for the copy 
 objects, we need to render the back side in order to properly show the 
 results.

 An alternative way to solve the problem is that We can set the side 
 equals to BackSide.

/**********************************************************************
* Approximately how many hours did you spend working on this assignment?
***********************************************************************/

6h


/**********************************************************************
 * Describe any problems you encountered in this assignment.
 **********************************************************************/

<Replace this with your response!>


/**********************************************************************
 * If you did any extra credit on this assignment, include relevant 
 * links and comments below.
 **********************************************************************/

<Replace this with your response>
